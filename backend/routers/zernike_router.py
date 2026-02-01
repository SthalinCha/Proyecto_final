"""
Router para endpoints de momentos Zernike
"""
from typing import List
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from models.clustering_models import clustering_models
from services.image_service import image_service
from services.clustering_service import clustering_service
from services.file_service import file_service
from utils.helpers import get_data_paths

router = APIRouter(prefix="/zernike", tags=["zernike"])


@router.post("/analyze")
async def analyze_images_zernike(
    files: List[UploadFile] = File(...),
    capacities: str = Form(None),
    clusters: int = Form(None)
):
    """
    Analiza imágenes con Momentos de Zernike y realiza clustering
    """
    if not files:
        raise HTTPException(status_code=400, detail="No se enviaron archivos")

    # Inicializar clustering si se proporcionan parámetros
    if capacities or clusters:
        try:
            caps = clustering_service.initialize_clustering("zernike", capacities, clusters)
            model = clustering_models.get_model("zernike", caps)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    results = []
    paths = get_data_paths()

    for file in files:
        try:
            # Procesar imagen
            file_content = await file.read()
            image_data = image_service.process_image(file_content, file.content_type, file.filename)
            
            # Extraer momentos Zernike
            momentos_zernike, vector_normalizado = image_service.extract_zernike_moments(image_data["resized_bytes"])
            
            # Guardar archivos
            file_service.save_image_files(image_data, paths)
            
            # Crear resultado base
            result = file_service.create_image_result(
                image_data=image_data,
                filename=file.filename,
                features={"momentos_zernike": momentos_zernike}
            )
            
            # Si hay modelo de clustering, hacer predicción
            if clustering_models.has_active_model("zernike"):
                cluster_id, centroid = clustering_service.predict_cluster("zernike", vector_normalizado, allow_new_clusters=True)
                result.update({
                    "cluster_id": cluster_id,
                    "ultimo_centroide": centroid.tolist()
                })
                print(f"[ZERNIKE-CLUSTER] id={image_data['image_id']} cluster={cluster_id} centroid={centroid.tolist()}")
            
            results.append(result)
            
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error procesando {file.filename}: {exc}")

    # Guardar estado y obtener métricas si hay modelo
    response = {"results": results}
    if clustering_models.has_active_model("zernike"):
        clustering_service.save_model_state("zernike")
        metrics = clustering_service.get_metrics("zernike")
        response["metrics"] = metrics
    
    return response


@router.post("/add-images")
async def add_images_zernike(files: List[UploadFile] = File(...)):
    """
    Agrega nuevas imágenes al clustering existente de Zernike
    """
    clustering_service.ensure_model_exists("zernike", "No hay modelo de clustering activo. Usa /zernike/analyze primero")
    
    if not files:
        raise HTTPException(status_code=400, detail="No se enviaron archivos")

    results = []
    paths = get_data_paths()

    for file in files:
        try:
            # Procesar imagen
            file_content = await file.read()
            image_data = image_service.process_image(file_content, file.content_type, file.filename)
            
            # Extraer momentos Zernike
            momentos_zernike, vector_normalizado = image_service.extract_zernike_moments(image_data["resized_bytes"])
            
            # Predecir cluster (sin crear nuevos)
            cluster_id, centroid = clustering_service.predict_cluster("zernike", vector_normalizado, allow_new_clusters=False)
            
            # Guardar archivos
            file_service.save_image_files(image_data, paths)
            
            # Crear resultado
            result = file_service.create_image_result(
                image_data=image_data,
                filename=file.filename,
                features={"momentos_zernike": momentos_zernike},
                cluster_data={"cluster_id": cluster_id, "centroid": centroid}
            )
            
            results.append(result)
            print(f"[ADD-ZERNIKE-CLUSTER] id={image_data['image_id']} cluster={cluster_id} centroid={centroid.tolist()}")
            
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error procesando {file.filename}: {exc}")

    # Guardar estado y obtener métricas
    clustering_service.save_model_state("zernike")
    metrics = clustering_service.get_metrics("zernike")
    
    return {
        "results": results,
        "metrics": metrics
    }


@router.post("/update-capacities")
async def update_capacities_zernike(capacities: str = Form(...)):
    """
    Actualiza las capacidades de los clusters existentes de Zernike
    """
    try:
        result = clustering_service.update_model_capacities("zernike", capacities)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/cluster-status")
def get_cluster_status_zernike():
    """
    Retorna el estado actual del clustering Zernike
    """
    return clustering_service.get_model_status("zernike")