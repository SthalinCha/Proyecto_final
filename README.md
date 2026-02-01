# Sistema de Análisis de Imágenes con Clustering

Sistema completo de procesamiento de imágenes con 6 métodos de extracción de características y clustering online usando LinksClusterCapacityOnline algorithm.

## 🚀 Ejecutar

1) En la carpeta del proyecto:

```bash
docker-compose up --build
```

2) Abrir en el navegador:

```
Frontend: http://localhost:8080
Backend API Docs: http://localhost:8000/docs
```

## 📋 APIs Disponibles

### 🔄 Métodos de Clustering (6 disponibles)

Todos los endpoints siguen el mismo patrón:
- **POST** `/api/{method}/analyze` - Analizar imágenes con clustering
- **POST** `/api/{method}/add-images` - Agregar imágenes a clustering existente

#### Parámetros comunes:
- `files`: Lista de archivos de imagen (multipart/form-data)
- `clusters`: Número de clusters deseado (opcional)
- `capacities`: Capacidades personalizadas por cluster (opcional, formato: "100,150,200")
- `reset`: Boolean para resetear modelo existente (opcional)

### 1️⃣ **Momentos Regulares**
```http
POST /api/moments/analyze
POST /api/moments/add-images
```

### 2️⃣ **Momentos de Hu** 
```http
POST /api/hu/analyze
POST /api/hu/add-images
```

### 3️⃣ **Momentos de Zernike**
```http
POST /api/zernike/analyze
POST /api/zernike/add-images
```

### 4️⃣ **SIFT (Scale-Invariant Feature Transform)**
```http
POST /api/sift/analyze
POST /api/sift/add-images
```

### 5️⃣ **HOG (Histogram of Oriented Gradients)**
```http
POST /api/hog/analyze  
POST /api/hog/add-images
```

### 6️⃣ **CNN/ResNet50 (Deep Learning)**
```http
POST /api/cnn/analyze
POST /api/cnn/add-images
```

## 📊 Respuesta de las APIs

```json
{
  "results": [
    {
      "id": "image_id",
      "filename": "image.jpg",
      "original_url": "/files/originals/image_id.jpg",
      "processed_url": "/files/processed/image_id_method.png",
      "descriptores": [...],
      "num_keypoints": 72,
      "cluster_id": 0,
      "ultimo_centroide": [...]
    }
  ],
  "metrics": {
    "internal_metrics": {
      "dunn_index": 1.1811,
      "silhouette_coefficient": 0.8149
    },
    "cluster_info": {
      "total_points": 6,
      "num_clusters": 2,
      "cluster_counts": [2, 4],
      "capacities": [100, 100, 100]
    },
    "external_metrics": {
      "available": false,
      "message": "No hay etiquetas verdaderas para métricas externas"
    }
  }
}
```

## 🗂️ Gestión de Archivos

### **Listar imágenes**
```http
GET /images
```

### **Eliminar todas las imágenes**
```http
DELETE /images
```

### **Acceder a archivos**
```http
GET /files/originals/{filename}     # Imagen original
GET /files/processed/{filename}     # Imagen procesada
GET /files/binarized/{filename}     # Imagen binarizada  
```

## 🎯 Ejemplos de Uso desde Frontend

### Ejemplo JavaScript - Analizar con SIFT:

```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('clusters', '3');

fetch('/api/sift/analyze', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('Clusters encontrados:', data.results);
    console.log('Métricas:', data.metrics);
});
```

### Ejemplo JavaScript - Agregar imágenes existentes:

```javascript
const formData = new FormData();
formData.append('files', newFile);

fetch('/api/sift/add-images', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('Nueva imagen agregada al cluster:', data.results[0].cluster_id);
});
```

## 🏗️ Arquitectura Técnica

### Backend (FastAPI + Python)
- **Framework**: FastAPI con routers modulares
- **Clustering**: LinksClusterCapacityOnline algorithm
- **CNN**: ResNet50 con TensorFlow (singleton pattern)
- **Métricas**: Dunn Index, Silhouette Coefficient, NMI, ARI, AMI
- **Procesamiento**: OpenCV, scikit-image, scikit-learn

### Frontend (Nginx + JavaScript)
- **Arquitectura**: ES6 modules, componentes modulares
- **Estilo**: CSS modular (main, components, gallery)
- **Proxy**: Nginx redirige `/api/*` al backend

### Base de Datos
- **Almacenamiento**: Sistema de archivos con `index.json`
- **Persistencia**: Volumen Docker `/data`

## 📁 Estructura del Proyecto

```
proyecto_final/
├── docker-compose.yml          # Orchestración de servicios
├── README.md                   # Esta documentación
├── backend/                    # API FastAPI
│   ├── main.py                # Aplicación principal
│   ├── Dockerfile             # Container backend
│   ├── requirements.txt       # Dependencias Python
│   ├── routers/              # Endpoints modulares
│   │   ├── moments_router.py
│   │   ├── hu_router.py
│   │   ├── zernike_router.py
│   │   ├── sift_router.py
│   │   ├── hog_router.py
│   │   └── cnn_router.py
│   ├── services/             # Lógica de negocio
│   │   ├── image_service.py
│   │   ├── clustering_service.py
│   │   └── file_service.py
│   ├── feature_extraction/   # Extracción características
│   │   ├── moments.py
│   │   ├── sift.py
│   │   ├── hog.py
│   │   └── cnn.py
│   ├── clustering/           # Algoritmos clustering
│   │   └── clustering_online.py
│   ├── preprocesamiento/     # Preprocesamiento imágenes
│   │   └── preprocesamiento.py
│   ├── models/              # Modelos de datos
│   │   └── clustering_models.py
│   └── utils/               # Utilidades
│       └── helpers.py
└── frontend/                # Interfaz web
    ├── index.html           # Página principal
    ├── Dockerfile          # Container frontend
    ├── nginx.conf          # Configuración proxy
    ├── assets/             # Recursos estáticos
    │   ├── css/           # Estilos modulares
    │   │   ├── main.css
    │   │   ├── components.css
    │   │   └── gallery.css
    │   ├── js/            # JavaScript modular
    │   │   ├── api.js
    │   │   ├── ui.js
    │   │   ├── clustering.js
    │   │   ├── gallery.js
    │   │   └── utils.js
    │   └── logo/          # Recursos gráficos
```

## 🔬 Algoritmos Implementados

### **LinksClusterCapacityOnline**
- Clustering online incremental
- Gestión de capacidad por cluster  
- Soporte para datos etiquetados y no etiquetados
- Creación automática de nuevos clusters

### **Métodos de Feature Extraction**
1. **Momentos Regulares**: m00, m10, m01, m20, etc.
2. **Momentos de Hu**: Invariantes a transformaciones
3. **Momentos de Zernike**: Invariantes a rotación
4. **SIFT**: Descriptores locales robustos
5. **HOG**: Gradientes orientados para formas
6. **CNN/ResNet50**: Features profundos 2048D

## 🎛️ Configuración

### Variables de Entorno
- Backend: Puerto 8000
- Frontend: Puerto 8080  
- Volumen datos: `/data`

### Docker Compose
```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    volumes: ["data:/data"]
  frontend:
    build: ./frontend  
    ports: ["8080:80"]
    depends_on: [backend]
```

## 🚦 Estado del Sistema

✅ **APIs Completamente Funcionales** (6/6):
- Momentos Regulares, Hu, Zernike
- SIFT, HOG, CNN/ResNet50

✅ **Frontend Modularizado**
✅ **Docker Containerizado** 
✅ **Métricas Comprensivas**
✅ **Documentación API Swagger**

---

**🔗 Accesos Rápidos:**
- **App**: http://localhost:8080
- **API Docs**: http://localhost:8000/docs  
- **Redoc**: http://localhost:8000/redoc
