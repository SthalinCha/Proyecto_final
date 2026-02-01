"""
Servicio para manejo de archivos
"""
import json
import os
from typing import List, Dict, Any
from utils.helpers import get_data_paths


class FileService:
    """
    Servicio para manejo de archivos e índices
    """
    
    @staticmethod
    def load_index() -> List[dict]:
        """
        Carga el índice de imágenes desde archivo
        """
        paths = get_data_paths()
        index_file = paths["index_file"]
        
        if not os.path.exists(index_file):
            return []
        
        try:
            with open(index_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except Exception:
            return []
    
    @staticmethod
    def save_index(items: List[dict]) -> None:
        """
        Guarda el índice de imágenes a archivo
        """
        paths = get_data_paths()
        index_file = paths["index_file"]
        
        with open(index_file, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
    
    @staticmethod
    def save_image_files(image_data: dict, paths: dict) -> None:
        """
        Guarda los archivos de imagen (original, procesado, binarizado)
        """
        file_names = image_data["file_names"]
        
        # Construir rutas completas
        original_path = os.path.join(paths["original_dir"], file_names["original"])
        processed_path = os.path.join(paths["processed_dir"], file_names["processed"])
        binarized_path = os.path.join(paths["binarized_dir"], file_names["binarized"])
        
        # Guardar archivos
        with open(original_path, "wb") as f:
            f.write(image_data["resized_bytes"])
        
        with open(processed_path, "wb") as f:
            f.write(image_data["processed_bytes"])
        
        with open(binarized_path, "wb") as f:
            f.write(image_data["binarized_bytes"])
    
    @staticmethod
    def save_specialized_image_file(image_bytes: bytes, file_type: str, image_data: dict, paths: dict) -> None:
        """
        Guarda archivos especializados (SIFT, HOG)
        """
        file_names = image_data["file_names"]
        
        if file_type == "sift":
            file_path = os.path.join(paths["processed_dir"], file_names["sift"])
        elif file_type == "hog":
            file_path = os.path.join(paths["processed_dir"], file_names["hog"])
        else:
            raise ValueError(f"Tipo de archivo no soportado: {file_type}")
        
        with open(file_path, "wb") as f:
            f.write(image_bytes)
    
    @staticmethod
    def create_image_result(
        image_data: dict,
        filename: str,
        features: Dict[str, Any] = None,
        cluster_data: Dict[str, Any] = None,
        file_type: str = "standard"
    ) -> dict:
        """
        Crea el diccionario de resultado para una imagen
        """
        file_names = image_data["file_names"]
        image_id = image_data["image_id"]
        
        result = {
            "id": image_id,
            "filename": filename,
            "original_url": f"/files/originals/{file_names['original']}",
        }
        
        # Agregar URLs según el tipo de archivo
        if file_type == "standard":
            result.update({
                "processed_url": f"/files/processed/{file_names['processed']}",
                "binarized_url": f"/files/binarized/{file_names['binarized']}",
            })
        elif file_type == "sift":
            result["processed_url"] = f"/files/processed/{file_names['sift']}"
        elif file_type == "hog":
            result["processed_url"] = f"/files/processed/{file_names['hog']}"
        
        # Agregar características si se proporcionan
        if features:
            result.update(features)
        
        # Agregar datos de clustering si se proporcionan
        if cluster_data:
            result.update({
                "cluster_id": cluster_data["cluster_id"],
                "ultimo_centroide": cluster_data["centroid"].tolist(),
            })
        
        return result
    
    @staticmethod
    def delete_all_images():
        """
        Elimina todas las imágenes y limpia el índice
        """
        paths = get_data_paths()
        items = FileService.load_index()
        
        # Eliminar archivos físicos
        for item in items:
            original_name = os.path.basename(item.get("original_url", ""))
            processed_name = os.path.basename(item.get("processed_url", ""))
            binarized_name = os.path.basename(item.get("binarized_url", ""))
            
            # Eliminar archivo original
            if original_name:
                original_path = os.path.join(paths["original_dir"], original_name)
                if os.path.exists(original_path):
                    os.remove(original_path)
            
            # Eliminar archivo procesado
            if processed_name:
                processed_path = os.path.join(paths["processed_dir"], processed_name)
                if os.path.exists(processed_path):
                    os.remove(processed_path)
            
            # Eliminar archivo binarizado
            if binarized_name:
                binarized_path = os.path.join(paths["binarized_dir"], binarized_name)
                if os.path.exists(binarized_path):
                    os.remove(binarized_path)
        
        # Limpiar índice
        FileService.save_index([])
    
    @staticmethod
    def get_file_path(file_type: str, filename: str) -> str:
        """
        Obtiene la ruta completa de un archivo
        """
        paths = get_data_paths()
        
        if file_type == "originals":
            return os.path.join(paths["original_dir"], filename)
        elif file_type == "processed":
            return os.path.join(paths["processed_dir"], filename)
        elif file_type == "binarized":
            return os.path.join(paths["binarized_dir"], filename)
        else:
            raise ValueError(f"Tipo de archivo no válido: {file_type}")


# Instancia global del servicio
file_service = FileService()