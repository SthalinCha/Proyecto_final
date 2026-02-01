"""
Router para endpoints de CNN (ResNet50)
"""
from typing import List
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from models.clustering_models import clustering_models
from services.image_service import image_service
from services.clustering_service import clustering_service
from services.file_service import file_service
from utils.helpers import get_data_paths

router = APIRouter(prefix="/cnn", tags=["cnn"])


@router.post("/analyze")
async def analyze_images_cnn(
    files: List[UploadFile] = File(...),
    capacities: str = Form(None),
    clusters: int = Form(None)
):
    """
    Analiza imágenes con CNN (ResNet50) y realiza clustering usando embeddings
    """
    if not files:
        raise HTTPException(status_code=400, detail="No se enviaron archivos")

    # Inicializar clustering si se proporcionan parámetros
    if capacities or clusters:
        try:
            caps = clustering_service.initialize_clustering("cnn", capacities, clusters)
            model = clustering_models.get_model("cnn", caps)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    results = []
    paths = get_data_paths()

    for file in files:
        try:
            # Procesar imagen básica
            file_content = await file.read()
            image_data = image_service.process_image(file_content, file.content_type, file.filename)
            
            # Extraer características CNN
            cnn_bytes, features, vector_normalizado = image_service.extract_cnn_features(image_data["processed_bytes"])
            
            # Guardar archivo original
            file_service.save_image_files(image_data, paths)
            
            # Guardar archivo CNN procesado (imagen redimensionada a 224x224)
            file_names = image_data["file_names"]
            cnn_name = f"{image_data['image_id']}_cnn.png"
            cnn_path = paths["processed_dir"] + "/" + cnn_name
            with open(cnn_path, "wb") as f:
                f.write(cnn_bytes)
            
            # Crear resultado base
            result = {
                "id": image_data["image_id"],
                "filename": file.filename,
                "original_url": f"/files/originals/{file_names['original']}",
                "processed_url": f"/files/processed/{cnn_name}",
                "embeddings_cnn": features,
                "num_features": len(features) if features else 0,
            }
            
            # Si hay modelo de clustering y embeddings, hacer predicción
            if clustering_models.has_active_model("cnn") and features and vector_normalizado is not None:
                cluster_id, centroid = clustering_service.predict_cluster("cnn", vector_normalizado, allow_new_clusters=True)
                result.update({
                    "cluster_id": cluster_id,
                    "ultimo_centroide": centroid.tolist()
                })
                print(f"[CNN-CLUSTER] id={image_data['image_id']} cluster={cluster_id} features={len(features)} centroid={centroid.tolist()}")
            
            results.append(result)
            
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error procesando {file.filename}: {exc}")

    # Guardar estado y obtener métricas si hay modelo
    response = {"results": results}
    if clustering_models.has_active_model("cnn"):
        clustering_service.save_model_state("cnn")
        metrics = clustering_service.get_metrics("cnn")
        response["metrics"] = metrics
    
    return response


@router.post("/add-images")
async def add_images_cnn(files: List[UploadFile] = File(...)):
    """
    Agrega nuevas imágenes al clustering existente de CNN
    """
    clustering_service.ensure_model_exists("cnn", "No hay modelo de clustering activo. Usa /cnn/analyze primero")
    
    if not files:
        raise HTTPException(status_code=400, detail="No se enviaron archivos")

    results = []
    paths = get_data_paths()

    for file in files:
        try:
            # Procesar imagen básica
            file_content = await file.read()
            image_data = image_service.process_image(file_content, file.content_type, file.filename)
            
            # Extraer características CNN
            cnn_bytes, features, vector_normalizado = image_service.extract_cnn_features(image_data["processed_bytes"])
            
            if not features or vector_normalizado is None:
                raise ValueError("No se pudieron extraer características CNN válidas")
            
            # Predecir cluster (sin crear nuevos)
            cluster_id, centroid = clustering_service.predict_cluster("cnn", vector_normalizado, allow_new_clusters=False)
            
            # Guardar archivo original
            file_service.save_image_files(image_data, paths)
            
            # Guardar archivo CNN procesado
            file_names = image_data["file_names"]
            cnn_name = f"{image_data['image_id']}_cnn.png"
            cnn_path = paths["processed_dir"] + "/" + cnn_name
            with open(cnn_path, "wb") as f:
                f.write(cnn_bytes)
            
            # Crear resultado
            result = {
                "id": image_data["image_id"],
                "filename": file.filename,
                "original_url": f"/files/originals/{file_names['original']}",
                "processed_url": f"/files/processed/{cnn_name}",
                "embeddings_cnn": features,
                "num_features": len(features),
                "cluster_id": cluster_id,
                "ultimo_centroide": centroid.tolist(),
            }
            
            results.append(result)
            print(f"[ADD-CNN-CLUSTER] id={image_data['image_id']} cluster={cluster_id} features={len(features)} centroid={centroid.tolist()}")
            
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error procesando {file.filename}: {exc}")

    # Guardar estado y obtener métricas
    clustering_service.save_model_state("cnn")
    metrics = clustering_service.get_metrics("cnn")
    
    return {
        "results": results,
        "metrics": metrics
    }


@router.post("/update-capacities")
async def update_capacities_cnn(capacities: str = Form(...)):
    """
    Actualiza las capacidades de los clusters existentes de CNN
    """
    try:
        result = clustering_service.update_model_capacities("cnn", capacities)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/cluster-status")
def get_cluster_status_cnn():
    """
    Retorna el estado actual del clustering CNN
    """
    return clustering_service.get_model_status("cnn")