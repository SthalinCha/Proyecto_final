"""
Router para endpoints de SIFT
"""
from typing import List
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from models.clustering_models import clustering_models
from services.image_service import image_service
from services.clustering_service import clustering_service
from services.file_service import file_service
from utils.helpers import get_data_paths

router = APIRouter(prefix="/sift", tags=["sift"])


@router.post("/analyze")
async def analyze_images_sift(
    files: List[UploadFile] = File(...),
    capacities: str = Form(None),
    clusters: int = Form(None)
):
    """
    Analiza imágenes con SIFT y realiza clustering usando promedio de descriptores
    """
    if not files:
        raise HTTPException(status_code=400, detail="No se enviaron archivos")

    # Inicializar clustering si se proporcionan parámetros
    if capacities or clusters:
        try:
            caps = clustering_service.initialize_clustering("sift", capacities, clusters)
            model = clustering_models.get_model("sift", caps)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    results = []
    paths = get_data_paths()

    for file in files:
        try:
            # Procesar imagen básica
            file_content = await file.read()
            image_data = image_service.process_image(file_content, file.content_type, file.filename)
            
            # Extraer características SIFT
            sift_bytes, descriptores, vector_normalizado = image_service.extract_sift_features(image_data["processed_bytes"])
            
            # Guardar archivo original
            file_service.save_image_files(image_data, paths)
            
            # Guardar archivo SIFT procesado
            file_service.save_specialized_image_file(sift_bytes, "sift", image_data, paths)
            
            # Crear resultado base
            result = file_service.create_image_result(
                image_data=image_data,
                filename=file.filename,
                features={
                    "descriptores": descriptores,
                    "num_keypoints": len(descriptores) if descriptores else 0
                },
                file_type="sift"
            )
            
            # Si hay modelo de clustering y descriptores, hacer predicción
            if clustering_models.has_active_model("sift") and descriptores and vector_normalizado is not None:
                cluster_id, centroid = clustering_service.predict_cluster("sift", vector_normalizado, allow_new_clusters=True)
                result.update({
                    "cluster_id": cluster_id,
                    "ultimo_centroide": centroid.tolist()
                })
                print(f"[SIFT-CLUSTER] id={image_data['image_id']} cluster={cluster_id} keypoints={len(descriptores)} centroid={centroid.tolist()}")
            
            results.append(result)
            
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error procesando {file.filename}: {exc}")

    # Guardar estado y obtener métricas si hay modelo
    response = {"results": results}
    if clustering_models.has_active_model("sift"):
        clustering_service.save_model_state("sift")
        metrics = clustering_service.get_metrics("sift")
        response["metrics"] = metrics
    
    return response


@router.post("/add-images")
async def add_images_sift(files: List[UploadFile] = File(...)):
    """
    Agrega nuevas imágenes al clustering existente de SIFT
    """
    clustering_service.ensure_model_exists("sift", "No hay modelo de clustering activo. Usa /sift/analyze primero")
    
    if not files:
        raise HTTPException(status_code=400, detail="No se enviaron archivos")

    results = []
    paths = get_data_paths()

    for file in files:
        try:
            # Procesar imagen básica
            file_content = await file.read()
            image_data = image_service.process_image(file_content, file.content_type, file.filename)
            
            # Extraer características SIFT
            sift_bytes, descriptores, vector_normalizado = image_service.extract_sift_features(image_data["processed_bytes"])
            
            if not descriptores or vector_normalizado is None:
                raise ValueError("No se pudieron extraer características SIFT válidas")
            
            # Predecir cluster (sin crear nuevos)
            cluster_id, centroid = clustering_service.predict_cluster("sift", vector_normalizado, allow_new_clusters=False)
            
            # Guardar archivo original
            file_service.save_image_files(image_data, paths)
            
            # Guardar archivo SIFT procesado
            file_service.save_specialized_image_file(sift_bytes, "sift", image_data, paths)
            
            # Crear resultado
            result = file_service.create_image_result(
                image_data=image_data,
                filename=file.filename,
                features={
                    "descriptores": descriptores,
                    "num_keypoints": len(descriptores)
                },
                cluster_data={"cluster_id": cluster_id, "centroid": centroid},
                file_type="sift"
            )
            
            results.append(result)
            print(f"[ADD-SIFT-CLUSTER] id={image_data['image_id']} cluster={cluster_id} keypoints={len(descriptores)} centroid={centroid.tolist()}")
            
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error procesando {file.filename}: {exc}")

    # Guardar estado y obtener métricas
    clustering_service.save_model_state("sift")
    metrics = clustering_service.get_metrics("sift")
    
    return {
        "results": results,
        "metrics": metrics
    }


@router.post("/update-capacities")
async def update_capacities_sift(capacities: str = Form(...)):
    """
    Actualiza las capacidades de los clusters existentes de SIFT
    """
    try:
        result = clustering_service.update_model_capacities("sift", capacities)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/cluster-status")
def get_cluster_status_sift():
    """
    Retorna el estado actual del clustering SIFT
    """
    return clustering_service.get_model_status("sift")