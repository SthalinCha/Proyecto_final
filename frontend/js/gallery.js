// Gallery functionality - Mostrar las 3 versiones

class GalleryManager {
    constructor() {
        this.resultsSection = document.getElementById('results-section');
        this.resultsContainer = document.getElementById('results-container');
        this.resultsCount = document.getElementById('results-count');
        this.clearAllBtn = document.getElementById('clear-all-btn');
        
        this.images = [];
        
        this.initializeEventListeners();
        
        // NO cargar galería automáticamente al inicio
        // Solo mostrar cuando se suban nuevas imágenes
    }
    
    initializeEventListeners() {
        // Botón limpiar todo
        this.clearAllBtn.addEventListener('click', () => {
            this.clearAll();
        });
    }
    
    showResults(newImages) {
        console.log('Showing results:', newImages);
        
        // Convertir formato usando las URLs que el backend ya proporciona
        const formattedImages = newImages.map(img => {
            const formatted = {
                id: img.id || generateId(),
                filename: img.filename,
                name: img.filename.split('.')[0],
                urls: {
                    // Usar las URLs que el backend ya proporciona
                    original: img.original_url || `/files/originals/${img.filename}`,
                    grayscale: img.processed_url || `/files/processed/${img.filename}`,
                    binary: img.binarized_url || `/files/binarized/${img.filename}`
                }
            };
            
            console.log('Imagen formateada:', formatted);
            return formatted;
        });
        
        this.images = [...formattedImages, ...this.images];
        this.render();
    }
    
    render() {
        if (this.images.length === 0) {
            this.resultsSection.style.display = 'none';
            return;
        }
        
        this.resultsSection.style.display = 'block';
        this.resultsCount.textContent = this.images.length;
        this.resultsContainer.innerHTML = '';
        
        this.images.forEach(image => {
            const resultItem = this.createResultItem(image);
            this.resultsContainer.appendChild(resultItem);
        });
    }
    
    createResultItem(image) {
        const item = document.createElement('div');
        item.className = 'result-item';
        
        item.innerHTML = `
            <div class="result-item-title">${image.filename}</div>
            <div class="result-item-images">
                <div class="result-image-wrapper">
                    <div class="result-image-label">Original</div>
                    <img src="${image.urls.original}" alt="Original" loading="lazy">
                </div>
                <div class="result-image-wrapper">
                    <div class="result-image-label">Escala de Grises</div>
                    <img src="${image.urls.grayscale}" alt="Grises" loading="lazy">
                </div>
                <div class="result-image-wrapper">
                    <div class="result-image-label">Binaria</div>
                    <img src="${image.urls.binary}" alt="Binaria" loading="lazy">
                </div>
            </div>
        `;
        
        return item;
    }
    
    async clearAll() {
        if (this.images.length === 0) return;
        
        const confirmed = confirm(
            `⚠️ ADVERTENCIA ⚠️\n\n¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE todas las ${this.images.length} imágenes?\n\nEsto borrará:\n• Imágenes originales\n• Imágenes procesadas (escala de grises)\n• Imágenes binarizadas\n• Todos los datos del clustering\n\nEsta acción NO se puede deshacer.`
        );
        
        if (!confirmed) return;
        
        try {
            showToast('Eliminando todas las imágenes...', 'info');
            await deleteAllImages();
            this.images = [];
            this.render();
            showToast('✓ Todas las imágenes han sido eliminadas permanentemente', 'success');
        } catch (error) {
            showToast('Error al eliminar imágenes', 'error');
            console.error('Error clearing gallery:', error);
        }
    }
}

// Inicializar
let galleryManager;
document.addEventListener('DOMContentLoaded', () => {
    galleryManager = new GalleryManager();
    window.galleryManager = galleryManager;
});
