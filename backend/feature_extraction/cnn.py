import cv2
import numpy as np
from sklearn.preprocessing import normalize

# Singleton para el modelo CNN
_cnn_model = None

def get_cnn_model():
    """Obtiene el modelo CNN (singleton pattern)"""
    global _cnn_model
    if _cnn_model is None:
        try:
            from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input
            _cnn_model = ResNet50(weights='imagenet', include_top=False, pooling='avg', input_shape=(256, 256, 3))
            print("Modelo ResNet50 cargado ✅")
        except ImportError:
            raise ValueError("TensorFlow no está instalado")
    return _cnn_model

def procesar_cnn_con_descriptores(image_bytes: bytes):
    """
    Extrae características CNN de una imagen usando ResNet50
    """
    try:
        from tensorflow.keras.applications.resnet50 import preprocess_input
        from tensorflow.keras.preprocessing.image import img_to_array
    except ImportError:
        raise ValueError("TensorFlow no está instalado")

    # Decodificar imagen
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen")

    # Redimensionar a 256x256 (entrada del modelo)
    img_resized = cv2.resize(img, (256, 256), interpolation=cv2.INTER_AREA)
    
    # Convertir BGR a RGB
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    
    # Preprocesar para ResNet50
    x = img_to_array(img_rgb)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    
    # Obtener modelo y extraer características
    model = get_cnn_model()
    features = model.predict(x, verbose=0)
    features_flat = features.flatten()
    
    # Normalizar características
    features_normalized = normalize(features_flat.reshape(1, -1), norm='l2')[0]
    
    # Crear imagen de visualización (opcional - mostrar imagen original)
    success, buffer = cv2.imencode(".png", img_resized)
    if not success:
        raise ValueError("No se pudo codificar la imagen CNN")
    
    return buffer.tobytes(), features_normalized.astype(float).tolist()

