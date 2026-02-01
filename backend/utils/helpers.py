"""
Funciones auxiliares comunes para el proyecto
"""
import os
from typing import List

# Configuración de tipos de archivos permitidos
ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def parse_capacities(capacities_text: str) -> List[int]:
    """
    Parsea una cadena de capacidades separadas por comas
    """
    parts = [p.strip() for p in capacities_text.split(",") if p.strip()]
    if not parts:
        raise ValueError("capacities vacío")
    return [int(p) for p in parts]


def validate_file_type(content_type: str) -> str:
    """
    Valida el tipo de archivo y retorna la extensión correspondiente
    """
    if content_type not in ALLOWED_TYPES:
        raise ValueError(f"Tipo no permitido: {content_type}")
    return ALLOWED_TYPES[content_type]


def validate_file_size(content: bytes, filename: str) -> None:
    """
    Valida el tamaño del archivo
    """
    if len(content) > MAX_FILE_SIZE:
        raise ValueError(f"Archivo demasiado grande: {filename}")


def get_data_paths():
    """
    Obtiene las rutas de datos del entorno
    """
    DATA_DIR = os.getenv("DATA_DIR", "/data")
    
    paths = {
        "data_dir": DATA_DIR,
        "original_dir": os.path.join(DATA_DIR, "originals"),
        "processed_dir": os.path.join(DATA_DIR, "processed"),
        "binarized_dir": os.path.join(DATA_DIR, "binarized"),
        "index_file": os.path.join(DATA_DIR, "index.json"),
        "cluster_state_file": os.path.join(DATA_DIR, "cluster_state.json"),
        "cluster_state_file_hu": os.path.join(DATA_DIR, "cluster_state_hu.json"),
        "cluster_state_file_zernike": os.path.join(DATA_DIR, "cluster_state_zernike.json"),
        "cluster_state_file_sift": os.path.join(DATA_DIR, "cluster_state_sift.json"),
        "cluster_state_file_hog": os.path.join(DATA_DIR, "cluster_state_hog.json"),
        "cluster_state_file_cnn": os.path.join(DATA_DIR, "cluster_state_cnn.json"),
    }
    
    # Crear directorios si no existen
    os.makedirs(paths["original_dir"], exist_ok=True)
    os.makedirs(paths["processed_dir"], exist_ok=True)
    os.makedirs(paths["binarized_dir"], exist_ok=True)
    
    return paths


def generate_file_names(image_id: str, content_type: str) -> dict:
    """
    Genera los nombres de archivos para original, procesado y binarizado
    """
    ext = validate_file_type(content_type)
    processed_ext = ".png"
    
    return {
        "original": f"{image_id}{ext}",
        "processed": f"{image_id}_processed{processed_ext}",
        "binarized": f"{image_id}_binarized{processed_ext}",
        "sift": f"{image_id}_sift{processed_ext}",
        "hog": f"{image_id}_hog{processed_ext}",
    }


def get_moment_keys():
    """
    Retorna las claves de momentos regulares en orden
    """
    return [
        "m00", "m10", "m01", "m20", "m11", "m02", "m30", "m21", "m12", "m03",
        "mu20", "mu11", "mu02", "mu30", "mu21", "mu12", "mu03",
        "nu20", "nu11", "nu02", "nu30", "nu21", "nu12", "nu03",
    ]


def get_hu_keys():
    """
    Retorna las claves de momentos Hu en orden
    """
    return [f"hu{i}" for i in range(1, 8)]


def get_zernike_keys():
    """
    Retorna las claves de momentos Zernike en orden
    """
    return [f"z{i}" for i in range(1, 26)]  # z1 a z25