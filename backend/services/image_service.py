"""
Servicio para procesamiento de imágenes
"""
import uuid
import numpy as np
from sklearn.preprocessing import normalize

# Importar desde módulos especializados
from preprocesamiento.preprocesamiento import (
    reescalar_imagen_bytes,
    procesar_imagen_bytes,
    binarizar_imagen_bytes,
)
from feature_extraction.moments import (
    calcular_momentos,
    calcular_momentos_hu,
    calcular_momentos_zernike,
)
from feature_extraction.sift import (
    procesar_sift_con_descriptores,
)
from feature_extraction.hog import (
    procesar_hog_con_descriptores,
)
from feature_extraction.cnn import (
    procesar_cnn_con_descriptores,
)
from utils.helpers import (
    validate_file_type,
    validate_file_size,
    generate_file_names,
    get_moment_keys,
    get_hu_keys,
    get_zernike_keys,
)


class ImageProcessingService:
    """
    Servicio para el procesamiento de imágenes y extracción de características
    """
    
    @staticmethod
    def process_image(content: bytes, content_type: str, filename: str) -> dict:
        """
        Procesa una imagen y extrae todas las características básicas
        """
        # Validaciones
        validate_file_size(content, filename)
        validate_file_type(content_type)
        
        # Generar ID y nombres de archivos
        image_id = uuid.uuid4().hex
        file_names = generate_file_names(image_id, content_type)
        
        try:
            # Procesar imagen
            resized_bytes = reescalar_imagen_bytes(content)
            processed_bytes = procesar_imagen_bytes(resized_bytes)
            binarized_bytes = binarizar_imagen_bytes(resized_bytes)
            
            return {
                "image_id": image_id,
                "file_names": file_names,
                "resized_bytes": resized_bytes,
                "processed_bytes": processed_bytes,
                "binarized_bytes": binarized_bytes,
            }
        except Exception as e:
            raise ValueError(f"Error procesando {filename}: {e}")
    
    @staticmethod
    def extract_moments(image_bytes: bytes) -> tuple:
        """
        Extrae momentos regulares y retorna vector normalizado
        """
        momentos = calcular_momentos(image_bytes)
        moment_keys = get_moment_keys()
        
        vector = [float(momentos[k]) for k in moment_keys]
        vector_array = np.array(vector, dtype=float).reshape(1, -1)
        vector_normalizado = normalize(vector_array, norm='l2')[0]
        
        return momentos, vector_normalizado
    
    @staticmethod
    def extract_hu_moments(image_bytes: bytes) -> tuple:
        """
        Extrae momentos Hu y retorna vector normalizado
        """
        momentos_hu = calcular_momentos_hu(image_bytes)
        hu_keys = get_hu_keys()
        
        vector = np.array([float(momentos_hu[k]) for k in hu_keys], dtype=float).reshape(1, -1)
        vector_normalizado = normalize(vector, norm='l2')[0]
        
        return momentos_hu, vector_normalizado
    
    @staticmethod
    def extract_zernike_moments(image_bytes: bytes) -> tuple:
        """
        Extrae momentos Zernike y retorna vector normalizado
        """
        momentos_zernike = calcular_momentos_zernike(image_bytes)
        zernike_keys = get_zernike_keys()
        
        vector = [float(momentos_zernike[k]) for k in zernike_keys]
        vector_array = np.array(vector, dtype=float).reshape(1, -1)
        vector_normalizado = normalize(vector_array, norm='l2')[0]
        
        return momentos_zernike, vector_normalizado
    
    @staticmethod
    def extract_sift_features(image_bytes: bytes) -> tuple:
        """
        Extrae características SIFT y retorna vector normalizado
        """
        sift_bytes, descriptores = procesar_sift_con_descriptores(image_bytes)
        
        if not descriptores:
            # Retornar vector cero si no hay descriptores
            vector_normalizado = np.zeros(128, dtype=float)  # SIFT tiene 128 dimensiones por descriptor
            return sift_bytes, descriptores, vector_normalizado
        
        # Usar el promedio de todos los descriptores como vector característico
        descriptores_array = np.array(descriptores, dtype=float)
        vector = np.mean(descriptores_array, axis=0)
        vector = vector.reshape(1, -1)
        vector_normalizado = normalize(vector, norm='l2')[0]
        
        return sift_bytes, descriptores, vector_normalizado
    
    @staticmethod
    def extract_hog_features(image_bytes: bytes) -> tuple:
        """
        Extrae características HOG y retorna vector normalizado
        """
        hog_bytes, descriptores_hog = procesar_hog_con_descriptores(image_bytes)
        
        if not descriptores_hog:
            # Retornar vector cero si no hay descriptores
            vector_normalizado = np.zeros(1000, dtype=float)  # HOG dimensiones típicas
            return hog_bytes, descriptores_hog, vector_normalizado
        
        # HOG devuelve un vector de características directamente
        vector = np.array(descriptores_hog, dtype=float).reshape(1, -1)
        vector_normalizado = normalize(vector, norm='l2')[0]
        
        return hog_bytes, descriptores_hog, vector_normalizado
    
    @staticmethod
    def extract_cnn_features(image_bytes: bytes) -> tuple:
        """
        Extrae características CNN usando la función ya implementada en feature_extraction
        """
        try:
            # Usar la función CNN que ya está bien implementada
            cnn_image_bytes, features_list = procesar_cnn_con_descriptores(image_bytes)
            
            # Convertir features a numpy array normalizado
            vector_normalizado = np.array(features_list, dtype=float)
            
            return cnn_image_bytes, features_list, vector_normalizado
            
        except Exception as e:
            raise ValueError(f"Error en extracción CNN: {e}")


# Instancia global del servicio
image_service = ImageProcessingService()