import cv2
import numpy as np
from skimage.feature import hog

def procesar_hog_con_descriptores(image_bytes: bytes):
    try:
        from skimage.feature import hog
    except ImportError:
        raise ValueError("scikit-image no está instalado")

    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen")

    features, hog_image = hog(
        img,
        orientations=6,
        pixels_per_cell=(16, 16),
        cells_per_block=(2, 2),
        block_norm="L2-Hys",
        visualize=True,
        feature_vector=True,
    )

    hog_norm = cv2.normalize(hog_image, None, 0, 255, cv2.NORM_MINMAX)
    hog_uint8 = hog_norm.astype(np.uint8)

    success, buffer = cv2.imencode(".png", hog_uint8)
    if not success:
        raise ValueError("No se pudo codificar la imagen HOG")

    return buffer.tobytes(), features.astype(float).tolist()
