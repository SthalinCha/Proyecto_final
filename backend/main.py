import os
import uuid
from typing import List
from fastapi import FastAPI, File, HTTPException, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

# Importar routers
from routers import moments_router, hu_router, zernike_router, sift_router, hog_router, cnn_router

# Importar servicios
from services.file_service import file_service
from services.image_service import image_service
from services.clustering_service import clustering_service
from utils.helpers import get_data_paths, validate_file_type, validate_file_size

# Importar modelos
from models.clustering_models import clustering_models

# Configuración de la aplicación
app = FastAPI(title="Sistema de Análisis de Imágenes", version="2.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Registrar routers con prefijo /api
app.include_router(moments_router.router, prefix="/api")
app.include_router(hu_router.router, prefix="/api")
app.include_router(zernike_router.router, prefix="/api")
app.include_router(sift_router.router, prefix="/api")
app.include_router(hog_router.router, prefix="/api")
app.include_router(cnn_router.router, prefix="/api")

# Obtener rutas de datos
paths = get_data_paths()


# ===== ENDPOINTS BÁSICOS =====

@app.get("/images")
def list_images():
    """Lista todas las imágenes almacenadas"""
    return file_service.load_index()

@app.get("/gallery")
def get_gallery():
    """Obtiene todas las imágenes de la galería con URLs completas"""
    items = file_service.load_index()
    return {"items": items, "total": len(items)}

@app.delete("/images")
def delete_images():
    """Elimina todas las imágenes almacenadas"""
    try:
        file_service.delete_all_images()
        # Limpiar los modelos de clustering
        clustering_models.reset_model("moments")
        return {"status": "ok", "message": "Todas las imágenes han sido eliminadas"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar imágenes: {str(e)}")


@app.post("/upload")
async def upload_images(files: List[UploadFile] = File(...)):
    """Sube imágenes sin procesamiento adicional"""
    if not files:
        raise HTTPException(status_code=400, detail="No se enviaron archivos")

    items = file_service.load_index()
    new_items = []

    for file in files:
        try:
            # Validar archivo
            validate_file_type(file.content_type)
            content = await file.read()
            validate_file_size(content, file.filename)

            # Procesar imagen
            image_data = image_service.process_image(content, file.content_type, file.filename)
            
            # Guardar archivos
            file_service.save_image_files(image_data, paths)

            # Crear item para el índice
            item = file_service.create_image_result(image_data, file.filename)
            items.append(item)
            new_items.append(item)

        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    file_service.save_index(items)
    return {"items": new_items}


# ===== ENDPOINTS DE ARCHIVOS =====

@app.get("/files/originals/{filename}")
def get_original(filename: str):
    """Obtiene una imagen original"""
    path = file_service.get_file_path("originals", filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(path)


@app.get("/files/processed/{filename}")
def get_processed(filename: str):
    """Obtiene una imagen procesada (escala de grises)"""
    path = file_service.get_file_path("processed", filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(path)


@app.get("/files/binarized/{filename}")
def get_binarized(filename: str):
    """Obtiene una imagen binarizada"""
    path = file_service.get_file_path("binarized", filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(path)


# ===== ENDPOINTS ADICIONALES PARA FRONTEND =====

@app.get("/image/{base_name}_grayscale.jpg")
def get_image_grayscale(base_name: str):
    """Obtiene la versión en escala de grises de una imagen"""
    processed_path = file_service.get_file_path("processed", f"{base_name}.jpg")
    if not os.path.exists(processed_path):
        processed_path = file_service.get_file_path("processed", f"{base_name}.png")
    if not os.path.exists(processed_path):
        processed_path = file_service.get_file_path("processed", f"{base_name}.jpeg")
    
    if os.path.exists(processed_path):
        return FileResponse(processed_path)
    
    raise HTTPException(status_code=404, detail="Imagen en escala de grises no encontrada")


@app.get("/image/{base_name}_binary.jpg")
def get_image_binary(base_name: str):
    """Obtiene la versión binaria de una imagen"""
    binary_path = file_service.get_file_path("binarized", f"{base_name}.jpg")
    if not os.path.exists(binary_path):
        binary_path = file_service.get_file_path("binarized", f"{base_name}.png")
    if not os.path.exists(binary_path):
        binary_path = file_service.get_file_path("binarized", f"{base_name}.jpeg")
    
    if os.path.exists(binary_path):
        return FileResponse(binary_path)
    
    raise HTTPException(status_code=404, detail="Imagen binaria no encontrada")


@app.get("/image/{filename}")
def get_image(filename: str):
    """Obtiene una imagen por nombre (original por defecto)"""
    # Primero intentar obtener la original
    original_path = file_service.get_file_path("originals", filename)
    if os.path.exists(original_path):
        return FileResponse(original_path)
    
    # Si no existe, buscar en procesadas
    processed_path = file_service.get_file_path("processed", filename)
    if os.path.exists(processed_path):
        return FileResponse(processed_path)
        
    raise HTTPException(status_code=404, detail="Imagen no encontrada")


@app.get("/gallery")
def get_gallery_data():
    """Obtiene datos estructurados para la galería del frontend"""
    items = file_service.load_index()
    
    gallery_data = []
    for item in items:
        gallery_item = {
            "id": str(uuid.uuid4()),
            "filename": item["filename"],
            "name": item["filename"].rsplit('.', 1)[0],  # Sin extensión
            "tag": item.get("tag", "Sin etiqueta"),
            "method": item.get("method", "moments"),
            "cluster": item.get("cluster_id", 0),
            "size": item.get("file_size", 0),
            "dimensions": item.get("dimensions", {"width": 0, "height": 0}),
            "uploadDate": item.get("timestamp", ""),
            "urls": {
                "original": f"/image/{item['filename']}",
                "grayscale": f"/image/{item['filename'].rsplit('.', 1)[0]}_grayscale.jpg",
                "binary": f"/image/{item['filename'].rsplit('.', 1)[0]}_binary.jpg"
            }
        }
        gallery_data.append(gallery_item)
    
    return {"images": gallery_data, "total": len(gallery_data)}


# ===== ENDPOINTS DE COMPATIBILIDAD (LEGACY) =====
# Endpoints de compatibilidad que redirigen a la nueva API con prefijo /api

@app.post("/analyze")
async def analyze_legacy(files: List[UploadFile] = File(...), capacities: str = Form(None), clusters: int = Form(None), reset: bool = Form(False)):
    """Endpoint de compatibilidad - usa moments por defecto"""
    # Usar la lógica directamente de los servicios
    try:
        if capacities or clusters or reset:
            caps = clustering_service.initialize_clustering("moments", capacities, clusters, reset)
            clustering_models.get_model("moments", caps)
        
        results = []
        for file in files:
            file_content = await file.read()
            image_data = image_service.process_image(file_content, file.content_type, file.filename)
            momentos, vector_normalizado = image_service.extract_moments(image_data["resized_bytes"])
            
            if clustering_models.has_active_model("moments"):
                cluster_id, centroid = clustering_service.predict_cluster("moments", vector_normalizado)
                file_service.save_image_files(image_data, paths)
                result = file_service.create_image_result(
                    image_data, file.filename, 
                    features={"moments": momentos},
                    cluster_data={"cluster_id": cluster_id, "centroid": centroid}
                )
            else:
                file_service.save_image_files(image_data, paths) 
                result = file_service.create_image_result(image_data, file.filename, features={"moments": momentos})
            
            results.append(result)
        
        response = {"results": results}
        if clustering_models.has_active_model("moments"):
            clustering_service.save_model_state("moments")
            response["metrics"] = clustering_service.get_metrics("moments")
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/add-images")
async def add_images_legacy(files: List[UploadFile] = File(...)):
    """Endpoint de compatibilidad - usa moments por defecto"""
    try:
        clustering_service.ensure_model_exists("moments", "No hay modelo de clustering activo. Usa /analyze primero")
        
        results = []
        for file in files:
            file_content = await file.read()
            image_data = image_service.process_image(file_content, file.content_type, file.filename)
            momentos, vector_normalizado = image_service.extract_moments(image_data["resized_bytes"])
            
            cluster_id, centroid = clustering_service.predict_cluster("moments", vector_normalizado, allow_new_clusters=False)
            file_service.save_image_files(image_data, paths)
            result = file_service.create_image_result(
                image_data, file.filename,
                features={"moments": momentos},
                cluster_data={"cluster_id": cluster_id, "centroid": centroid}
            )
            results.append(result)
        
        clustering_service.save_model_state("moments")
        return {"results": results, "metrics": clustering_service.get_metrics("moments")}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/update-capacities")
async def update_capacities_legacy(capacities: str = Form(...)):
    """Endpoint de compatibilidad - usa moments por defecto"""
    try:
        return clustering_service.update_model_capacities("moments", capacities)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/cluster-status")
def get_cluster_status_legacy():
    """Endpoint de compatibilidad - usa moments por defecto"""
    return clustering_service.get_model_status("moments")


@app.get("/debug/files")
def debug_files():
    """Debug: Lista todos los archivos guardados"""
    import os
    debug_info = {
        "data_paths": paths,
        "files": {}
    }
    
    for folder_name, folder_path in paths.items():
        if os.path.exists(folder_path):
            files = os.listdir(folder_path)
            debug_info["files"][folder_name] = files
        else:
            debug_info["files"][folder_name] = "Carpeta no existe"
    
    return debug_info


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)