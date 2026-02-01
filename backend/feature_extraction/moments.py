import cv2
import numpy as np


def calcular_momentos(image_bytes: bytes) -> dict:
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen")

    _, binaria = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    moments = cv2.moments(binaria)

    return {
        "m00": moments["m00"],
        "m10": moments["m10"],
        "m01": moments["m01"],
        "m20": moments["m20"],
        "m11": moments["m11"],
        "m02": moments["m02"],
        "m30": moments["m30"],
        "m21": moments["m21"],
        "m12": moments["m12"],
        "m03": moments["m03"],
        "mu20": moments["mu20"],
        "mu11": moments["mu11"],
        "mu02": moments["mu02"],
        "mu30": moments["mu30"],
        "mu21": moments["mu21"],
        "mu12": moments["mu12"],
        "mu03": moments["mu03"],
        "nu20": moments["nu20"],
        "nu11": moments["nu11"],
        "nu02": moments["nu02"],
        "nu30": moments["nu30"],
        "nu21": moments["nu21"],
        "nu12": moments["nu12"],
        "nu03": moments["nu03"],
    }


def calcular_momentos_hu(image_bytes: bytes) -> dict:
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen")

    _, binaria = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    moments = cv2.moments(binaria)
    hu_moments = cv2.HuMoments(moments).flatten().tolist()

    return {
        "hu1": hu_moments[0],
        "hu2": hu_moments[1],
        "hu3": hu_moments[2],
        "hu4": hu_moments[3],
        "hu5": hu_moments[4],
        "hu6": hu_moments[5],
        "hu7": hu_moments[6],
    }


def calcular_momentos_zernike(image_bytes: bytes, radius: int = 128) -> dict:
    try:
        import mahotas
    except ImportError:
        raise ValueError("Mahotas no está instalado")

    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen")

    _, binaria = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    zernike = mahotas.features.zernike_moments(binaria, radius=radius, degree=8)

    result = {}
    for i, val in enumerate(zernike):
        result[f"z{i+1}"] = float(val)

    return result