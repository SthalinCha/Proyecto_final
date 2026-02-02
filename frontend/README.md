# Frontend - Sistema de Análisis de Imágenes

Este es el frontend de la aplicación de análisis de imágenes, construido con HTML, CSS y JavaScript vanilla.

## Estructura del Proyecto

```
frontend/
├── index.html          # Página principal de la aplicación
├── css/
│   ├── styles.css      # Estilos base y layout principal
│   └── components.css  # Estilos de componentes específicos
├── js/
│   ├── app.js         # Configuración principal y inicialización
│   ├── gallery.js     # Funciones de la galería de imágenes
│   ├── upload.js      # Lógica de subida y procesamiento
│   └── utils.js       # Utilidades generales
├── Dockerfile         # Configuración de Docker
├── nginx.conf         # Configuración de nginx
└── README.md          # Este archivo
```

## Características

### ✨ Funcionalidades Principales

1. **Subida de Imágenes**
   - Drag & drop de archivos
   - Selección múltiple de archivos
   - Validación de tipo y tamaño
   - Preview antes del procesamiento

2. **Procesamiento**
   - Múltiples métodos de extracción (Momentos, SIFT, HOG, CNN, Zernike)
   - Configuración de clustering
   - Progreso visual del procesamiento
   - Resultados en tiempo real

3. **Galería**
   - Vista de todas las imágenes procesadas
   - Filtros por tipo (original, escala de grises, binaria)
   - Modal de vista detallada
   - Navegación entre versiones

4. **Configuración**
   - Panel lateral con opciones
   - Selección de método de análisis
   - Configuración de clusters
   - Opciones avanzadas

### 🎨 Diseño y UX

- **Responsive Design**: Se adapta a diferentes tamaños de pantalla
- **Interfaz Moderna**: Diseño limpio con gradientes y sombras
- **Feedback Visual**: Notificaciones, progress bars y estados de carga
- **Navegación Intuitiva**: Controles claros y accesibles

### 🚀 Optimizaciones

- **Lazy Loading**: Carga diferida de imágenes
- **Compresión**: Gzip habilitado en nginx
- **Cache**: Estrategias de cache para recursos estáticos
- **SEO Friendly**: Meta tags y estructura semántica

## Configuración del Desarrollo

### Requisitos Previos

- Docker y Docker Compose
- Navegador web moderno
- Backend en funcionamiento (puerto 8000)

### Ejecutar en Desarrollo

1. **Con Docker Compose** (Recomendado)
   ```bash
   docker-compose up --build
   ```

2. **Solo Frontend**
   ```bash
   cd frontend
   docker build -t frontend-app .
   docker run -p 3000:80 frontend-app
   ```

3. **Desarrollo Local** (Servidor HTTP simple)
   ```bash
   cd frontend
   # Con Python
   python -m http.server 3000
   
   # Con Node.js
   npx http-server -p 3000
   
   # Con PHP
   php -S localhost:3000
   ```

### Variables de Entorno

La aplicación se conecta automáticamente al backend a través de nginx. Las rutas están configuradas para:

- **API**: `/api/*` → `http://backend:8000/api/*`
- **Archivos**: `/images/*`, `/files/*` → `http://backend:8000/*`

## Estructura de CSS

### Variables CSS
Las variables están definidas en `styles.css` para facilitar la personalización:

```css
:root {
    --primary-color: #3498db;
    --secondary-color: #2c3e50;
    --success-color: #27ae60;
    --danger-color: #e74c3c;
    /* ... más variables */
}
```

### Metodología
- **Mobile First**: Los estilos base son para móviles
- **Progressive Enhancement**: Mejoras para pantallas más grandes
- **Componentes Modulares**: Cada componente tiene sus estilos específicos

## JavaScript - Arquitectura

### Estado Global
```javascript
const AppState = {
    currentImages: [],      // Imágenes cargadas
    galleryVisible: false,  // Estado de la galería
    isProcessing: false,    // Estado de procesamiento
    currentFilter: 'all'    // Filtro actual de galería
};
```

### Módulos

1. **app.js**: Inicialización y configuración general
2. **upload.js**: Manejo de subida y procesamiento de archivos
3. **gallery.js**: Funcionalidades de la galería
4. **utils.js**: Funciones de utilidad reutilizables

### Eventos Principales

- Drag & Drop de archivos
- Procesamiento de imágenes
- Navegación de galería
- Filtros y búsqueda
- Modales y overlays

## API Endpoints Utilizados

### Imágenes
- `GET /images` - Listar imágenes
- `POST /upload` - Subir archivos
- `DELETE /images` - Eliminar todas las imágenes
- `GET /gallery` - Datos de galería

### Procesamiento
- `POST /api/moments/analyze` - Análisis con momentos
- `POST /api/sift/analyze` - Análisis con SIFT
- `POST /api/hog/analyze` - Análisis con HOG
- `POST /api/cnn/analyze` - Análisis con CNN
- `POST /api/zernike/analyze` - Análisis con Zernike

### Archivos
- `GET /files/originals/{filename}` - Imagen original
- `GET /files/processed/{filename}` - Imagen en escala de grises
- `GET /files/binarized/{filename}` - Imagen binarizada

## Configuración de nginx

El archivo `nginx.conf` incluye:

- **Proxy reverso** para el backend
- **Compresión gzip** para mejor rendimiento
- **Headers de seguridad** (XSS, CSRF protection)
- **Cache estratégico** para recursos estáticos
- **Manejo de SPA** (Single Page Application)

## Personalización

### Colores y Tema
Modifica las variables CSS en `styles.css`:

```css
:root {
    --primary-color: #tu-color;
    --secondary-color: #tu-color;
    /* ... */
}
```

### Añadir Nuevos Métodos
1. Agregar opción en el `<select>` del HTML
2. Actualizar `getUploadEndpoint()` en `upload.js`
3. Implementar endpoint correspondiente en el backend

### Modificar Layout
- **Sidebar**: Ajustar `--sidebar-width` en CSS
- **Header**: Modificar `--header-height` 
- **Responsive**: Personalizar breakpoints en media queries

## Troubleshooting

### Problemas Comunes

1. **Imágenes no cargan**
   - Verificar que el backend esté ejecutándose
   - Revisar configuración de nginx
   - Comprobar permisos de archivos

2. **Upload falla**
   - Verificar tamaño de archivo (límite 100MB)
   - Comprobar tipo de archivo (solo imágenes)
   - Revisar logs del backend

3. **Estilos no se aplican**
   - Verificar rutas de archivos CSS
   - Limpiar cache del navegador
   - Revisar errores de sintaxis CSS

### Logs

```bash
# Logs de nginx
docker-compose logs frontend

# Logs del navegador
# Abrir DevTools → Console/Network
```

## Futuras Mejoras

- [ ] Service Worker para funcionamiento offline
- [ ] Internacionalización (i18n)
- [ ] Modo oscuro
- [ ] Filtros avanzados en galería
- [ ] Exportación de resultados
- [ ] Comparación lado a lado de imágenes
- [ ] Zoom y pan en vista de imágenes
- [ ] Drag & drop para reorganizar galería

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.