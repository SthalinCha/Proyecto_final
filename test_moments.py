"""
Script de prueba para el módulo de Momentos
"""
import requests
from PIL import Image, ImageDraw
import io
import time

BASE_URL = "http://localhost:8000/api/moments"

def create_test_image(name, size=(200, 200), shape='circle'):
    """Crear imagen de prueba simple"""
    img = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(img)
    
    if shape == 'circle':
        draw.ellipse([50, 50, 150, 150], fill='black')
    elif shape == 'square':
        draw.rectangle([50, 50, 150, 150], fill='black')
    elif shape == 'triangle':
        draw.polygon([(100, 50), (50, 150), (150, 150)], fill='black')
    
    # Guardar en bytes
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    return buffer, f"{name}.jpg"

print("=" * 60)
print("PRUEBA DEL MÓDULO DE MOMENTOS")
print("=" * 60)

# Test 1: Inicializar clustering con 3 clusters
print("\n1. Creando imágenes de prueba...")
images = [
    create_test_image("circle1", shape='circle'),
    create_test_image("circle2", shape='circle'),
    create_test_image("square1", shape='square'),
    create_test_image("square2", shape='square'),
    create_test_image("triangle1", shape='triangle'),
    create_test_image("triangle2", shape='triangle'),
]
print(f"✓ {len(images)} imágenes creadas")

# Test 2: Analizar imágenes (inicializar clustering)
print("\n2. Inicializando clustering con 3 clusters (capacidades: 3,3,3)...")
files = [('files', (name, buffer, 'image/jpeg')) for buffer, name in images]
data = {
    'clusters': '3',
    'capacities': '3,3,3',
    'reset': 'true'
}

try:
    response = requests.post(f"{BASE_URL}/analyze", files=files, data=data)
    
    # Reabrir buffers
    for buffer, _ in images:
        buffer.seek(0)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Clustering inicializado exitosamente")
        print(f"  - Imágenes procesadas: {len(result.get('results', []))}")
        
        # Mostrar asignación de clusters
        print("\n  Asignación de clusters:")
        for img in result.get('results', []):
            cluster_id = img.get('cluster_id', 'N/A')
            filename = img.get('filename', 'N/A')
            print(f"    • {filename} → Cluster {cluster_id + 1 if isinstance(cluster_id, int) else cluster_id}")
        
        # Mostrar métricas
        metrics = result.get('metrics', {})
        if metrics:
            print("\n  Métricas de evaluación:")
            internal = metrics.get('internal_metrics', {})
            if internal:
                print(f"    • Dunn Index: {internal.get('dunn_index', 'N/A')}")
                print(f"    • Silhouette: {internal.get('silhouette_coefficient', 'N/A')}")
    else:
        print(f"✗ Error {response.status_code}: {response.text}")
        exit(1)
        
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)

# Test 3: Ver estado de clusters
print("\n3. Consultando estado de clusters...")
try:
    response = requests.get(f"{BASE_URL}/cluster-status")
    if response.status_code == 200:
        status = response.json()
        print("✓ Estado obtenido")
        
        clusters = status.get('clusters', [])
        for i, cluster in enumerate(clusters):
            count = cluster.get('count', 0)
            capacity = cluster.get('capacity', 0)
            print(f"    • Cluster {i+1}: {count}/{capacity} imágenes")
        
        # Métricas del estado
        metrics = status.get('metrics', {})
        if metrics:
            internal = metrics.get('internal_metrics', {})
            if internal:
                print(f"\n  Métricas actuales:")
                print(f"    • Dunn Index: {internal.get('dunn_index', 'N/A')}")
                print(f"    • Silhouette: {internal.get('silhouette_coefficient', 'N/A')}")
    else:
        print(f"✗ Error {response.status_code}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 4: Agregar más imágenes
print("\n4. Agregando 2 imágenes adicionales...")
new_images = [
    create_test_image("circle3", shape='circle'),
    create_test_image("square3", shape='square'),
]

files = [('files', (name, buffer, 'image/jpeg')) for buffer, name in new_images]

try:
    response = requests.post(f"{BASE_URL}/add-images", files=files)
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Imágenes agregadas exitosamente")
        print(f"  - Nuevas imágenes: {len(result.get('results', []))}")
        
        for img in result.get('results', []):
            cluster_id = img.get('cluster_id', 'N/A')
            filename = img.get('filename', 'N/A')
            print(f"    • {filename} → Cluster {cluster_id + 1 if isinstance(cluster_id, int) else cluster_id}")
    else:
        print(f"✗ Error {response.status_code}: {response.text}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 5: Actualizar capacidades
print("\n5. Actualizando capacidades a 5,5,5...")
try:
    response = requests.post(
        f"{BASE_URL}/update-capacities",
        data={'capacities': '5,5,5'}
    )
    if response.status_code == 200:
        print("✓ Capacidades actualizadas")
    else:
        print(f"✗ Error {response.status_code}: {response.text}")
except Exception as e:
    print(f"✗ Error: {e}")

# Estado final
print("\n6. Estado final del clustering:")
try:
    response = requests.get(f"{BASE_URL}/cluster-status")
    if response.status_code == 200:
        status = response.json()
        clusters = status.get('clusters', [])
        print(f"✓ Total de imágenes procesadas: {sum(c.get('count', 0) for c in clusters)}")
        print(f"✓ Clusters activos: {len(clusters)}")
        
        for i, cluster in enumerate(clusters):
            count = cluster.get('count', 0)
            capacity = cluster.get('capacity', 0)
            available = capacity - count
            print(f"    • Cluster {i+1}: {count}/{capacity} (disponibles: {available})")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
print("PRUEBA COMPLETADA")
print("=" * 60)
print("\nAhora puedes:")
print("1. Abrir http://localhost:8080")
print("2. Ir a la sección 'Momentos'")
print("3. Hacer clic en 'Ver Estado y Métricas' para ver los resultados")
