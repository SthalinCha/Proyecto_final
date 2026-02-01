import cv2
import numpy as np

# ====================================================
#        FUNCIÓN PARA CONVERTIR A ESCALA DE GRISES
# ====================================================

def escala_grises(img):
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


# ============================
#   1. ESTADÍSTICAS DE IMAGEN
# ============================

def miStat(P):
    media = np.mean(P)
    varianza = np.var(P)
    desviacion = np.std(P)
    return media, varianza, desviacion


# ============================
#   2. AMPLIACIÓN DE HISTOGRAMA
# ============================

def miAmpliH(P, a, b, L):
    P = np.array(P, dtype=float)
    X = L * ((P - a) / (b - a))
    X[X < 0] = 0
    X[X > L] = L
    return X.astype(np.uint8)


# ============================
#   3. TRANSFORMACIÓN CUADRÁTICA
# ============================

def micuadrada(P, L, O):
    P = np.array(P, dtype=float)

    if O == 0:
        X = P**2 / L
    elif O == 1:
        X = np.sqrt(L * P)
    else:
        raise ValueError("O debe ser 0 (cuadrática) u 1 (raíz)")

    X[X < 0] = 0
    X[X > L] = L
    return X.astype(np.uint8)


# ============================
#   4. ECUALIZACIÓN DE HISTOGRAMA
# ============================

def miEcualizador(P):
    L_max = 255
    N, M = P.shape
    total_pixeles = N * M

    hist, _ = np.histogram(P.flatten(), 256, [0, 256])
    cdf = hist.cumsum()
    cdf_normalized = np.round((L_max / total_pixeles) * cdf).astype(np.uint8)

    X = cdf_normalized[P]
    return X


# ================================================
#     PROCESAMIENTO BASADO EN PERCENTILES
#     Clasificación automática de imágenes
# ================================================

def procesar_prioridad_unica(img, percentiles):
    Lmax = 255

    p10 = percentiles[1]
    p25 = percentiles[2]
    p50 = percentiles[3]
    p75 = percentiles[4]
    p90 = percentiles[5]

    if p50 < 85 and p90 < 150:
        salida = micuadrada(img, Lmax, 1)
        return salida, "subexpo_raiz"

    if p50 > 170 and p10 > 100:
        salida = micuadrada(img, Lmax, 0)
        return salida, "sobreexpo_cuadratica"

    if (p90 - p10) < 40:
        a = np.min(img)
        b = np.max(img)
        salida = miAmpliH(img, a, b, Lmax)
        return salida, "bajo_contraste_stretching"

    return img, "original"


# ====================================================
#   API REQUERIDA POR EL BACKEND
#   Reemplaza la lógica interna con tu preprocesamiento real.
# ====================================================

def reescalar_imagen_bytes(image_bytes: bytes, size=(256, 256)) -> bytes:
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen")

    resized = cv2.resize(img, size, interpolation=cv2.INTER_AREA)
    success, buffer = cv2.imencode(".png", resized)
    if not success:
        raise ValueError("No se pudo codificar la imagen reescalada")

    return buffer.tobytes()


def procesar_imagen_bytes(image_bytes: bytes) -> bytes:
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen")

    resized = cv2.resize(img, (256, 256), interpolation=cv2.INTER_AREA)

    # === EJEMPLO: convertir a escala de grises ===
    # Reemplaza este bloque por tu lógica real.
    procesada = escala_grises(resized)

    success, buffer = cv2.imencode(".png", procesada)
    if not success:
        raise ValueError("No se pudo codificar la imagen procesada")

    return buffer.tobytes()


def binarizar_imagen_bytes(image_bytes: bytes) -> bytes:
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen")

    _, binaria = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    success, buffer = cv2.imencode(".png", binaria)
    if not success:
        raise ValueError("No se pudo codificar la imagen binarizada")

    return buffer.tobytes()

