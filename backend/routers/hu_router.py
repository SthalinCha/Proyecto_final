"""
Router para endpoints de momentos Hu
"""
from typing import List
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from models.clustering_models import clustering_models
from services.image_service import image_service
from services.clustering_service import clustering_service
from services.file_service import file_service
from utils.helpers import get_data_paths

router = APIRouter(prefix="/hu", tags=["hu"])


@router.post("/analyze")
async def analyze_images_hu(
    files: List[UploadFile] = File(...),
    capacities: str | None = Form(None),
    clusters: int | None = Form(None),
    reset: bool = Form(False),
):
    """
    Analiza imágenes con momentos Hu y realiza clustering
    """
    if not files:
        raise HTTPException(status_code=400, detail="No se enviaron archivos")

    # Inicializar clustering
    try:
        caps = clustering_service.initialize_clustering("hu", capacities, clusters, reset)
        model = clustering_models.get_model("hu", caps)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    results = []
    paths = get_data_paths()

    for file in files:
        try:
            # Procesar imagen
            file_content = await file.read()
            image_data = image_service.process_image(file_content, file.content_type, file.filename)
            
            # Extraer momentos Hu
            momentos_hu, vector_normalizado = image_service.extract_hu_moments(image_data["resized_bytes"])
            
            # Predecir cluster
            cluster_id, centroid = clustering_service.predict_cluster("hu", vector_normalizado)
            
            # Guardar archivos
            file_service.save_image_files(image_data, paths)
            
            # Crear resultado
            result = file_service.create_image_result(
                image_data=image_data,
                filename=file.filename,
                features={"momentos_hu": momentos_hu},
                cluster_data={"cluster_id": cluster_id, "centroid": centroid}
            )
            
            results.append(result)
            print(f"[CLUSTER-HU] id={image_data['image_id']} cluster={cluster_id} centroid={centroid.tolist()}")
            
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error procesando {file.filename}: {exc}")

    # Guardar estado y obtener métricas
    clustering_service.save_model_state("hu")
    metrics = clustering_service.get_metrics("hu")
    
    return {
        "results": results,
        "metrics": metrics
    }


@router.post("/add-images")
async def add_images_hu(files: List[UploadFile] = File(...)):
    """
    Agrega nuevas imágenes al clustering existente de momentos Hu
    """
    clustering_service.ensure_model_exists("hu", "No hay modelo de clustering activo. Usa /hu/analyze primero")
    
    if not files:
        raise HTTPException(status_code=400, detail="No se enviaron archivos")

    results = []
    paths = get_data_paths()

    for file in files:
        try:
            # Procesar imagen
            file_content = await file.read()
            image_data = image_service.process_image(file_content, file.content_type, file.filename)
            
            # Extraer momentos Hu
            momentos_hu, vector_normalizado = image_service.extract_hu_moments(image_data["resized_bytes"])
            
            # Predecir cluster (sin crear nuevos)
            cluster_id, centroid = clustering_service.predict_cluster("hu", vector_normalizado, allow_new_clusters=False)
            
            # Guardar archivos
            file_service.save_image_files(image_data, paths)
            
            # Crear resultado
            result = file_service.create_image_result(
                image_data=image_data,
                filename=file.filename,
                features={"momentos_hu": momentos_hu},
                cluster_data={"cluster_id": cluster_id, "centroid": centroid}
            )
            
            results.append(result)
            print(f"[ADD-CLUSTER-HU] id={image_data['image_id']} cluster={cluster_id} centroid={centroid.tolist()}")
            
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error procesando {file.filename}: {exc}")

    # Guardar estado y obtener métricas
    clustering_service.save_model_state("hu")
    metrics = clustering_service.get_metrics("hu")
    
    return {
        "results": results,
        "metrics": metrics
    }


@router.post("/update-capacities")
async def update_capacities_hu(capacities: str = Form(...)):
    """
    Actualiza las capacidades de los clusters existentes de momentos Hu
    """
    try:
        result = clustering_service.update_model_capacities("hu", capacities)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/cluster-status")
def get_cluster_status_hu():
    """
    Retorna el estado actual del clustering de momentos Hu
    """
    return clustering_service.get_model_status("hu")