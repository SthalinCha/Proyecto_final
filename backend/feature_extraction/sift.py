
import cv2
import numpy as np


def procesar_sift_con_descriptores(image_bytes: bytes):
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    sift = cv2.SIFT_create()
    keypoints, descriptors = sift.detectAndCompute(gray, None)

    salida = cv2.drawKeypoints(
        img, keypoints, None, flags=cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS
    )

    success, buffer = cv2.imencode(".png", salida)
    if not success:
        raise ValueError("No se pudo codificar la imagen SIFT")

    if descriptors is None:
        desc_list = []
    else:
        desc_list = descriptors.astype(float).tolist()

    return buffer.tobytes(), desc_list