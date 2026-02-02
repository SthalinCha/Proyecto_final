// Upload functionality - Preview antes de subir

class UploadManager {
    constructor() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.previewSection = document.getElementById('preview-section');
        this.previewContainer = document.getElementById('preview-container');
        this.previewCount = document.getElementById('preview-count');
        this.uploadBtn = document.getElementById('upload-btn');
        this.progressContainer = document.getElementById('upload-progress');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        
        this.selectedFiles = [];
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Drag and drop events
        this.dropZone.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });
        
        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });
        
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFileSelection(files);
        });
        
        // File input change
        this.fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFileSelection(files);
            // Reset input
            e.target.value = '';
        });
        
        // Botón cargar imágenes
        this.uploadBtn.addEventListener('click', () => {
            this.uploadFiles();
        });
    }
    
    handleFileSelection(files) {
        if (files.length === 0) return;
        
        // Validar y agregar archivos
        files.forEach(file => {
            try {
                validateImageFile(file);
                this.selectedFiles.push(file);
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
        
        this.renderPreview();
    }
    
    renderPreview() {
        if (this.selectedFiles.length === 0) {
            this.previewSection.style.display = 'none';
            return;
        }
        
        this.previewSection.style.display = 'block';
        this.previewCount.textContent = this.selectedFiles.length;
        this.previewContainer.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="preview-item-remove" data-index="${index}">&times;</button>
                    <div class="preview-item-name">${file.name}</div>
                `;
                
                const removeBtn = previewItem.querySelector('.preview-item-remove');
                removeBtn.addEventListener('click', () => {
                    this.removeFile(index);
                });
                
                this.previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }
    
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.renderPreview();
        showToast('Imagen eliminada del preview', 'info');
    }
    
    async uploadFiles() {
        if (this.selectedFiles.length === 0) {
            showToast('No hay imágenes para cargar', 'error');
            return;
        }
        
        try {
            this.showProgress();
            this.updateProgress(0, `Cargando ${this.selectedFiles.length} imagen(es)...`);
            
            const result = await uploadImages(this.selectedFiles);
            
            this.updateProgress(100, 'Procesando imágenes...');
            
            // Esperar un momento
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.hideProgress();
            
            // Mostrar resultados
            if (result.items && result.items.length > 0) {
                window.galleryManager.showResults(result.items);
                showToast(
                    `${result.items.length} imagen(es) procesada(s) correctamente`,
                    'success'
                );
                
                // Limpiar preview
                this.selectedFiles = [];
                this.renderPreview();
            }
            
        } catch (error) {
            this.hideProgress();
            showToast(`Error al cargar imágenes: ${error.message}`, 'error');
            console.error('Upload error:', error);
        }
    }
    
    showProgress() {
        this.progressContainer.style.display = 'block';
        this.previewSection.style.display = 'none';
    }
    
    hideProgress() {
        this.progressContainer.style.display = 'none';
    }
    
    updateProgress(percent, text) {
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = text;
    }
}

// Inicializar
let uploadManager;
document.addEventListener('DOMContentLoaded', () => {
    uploadManager = new UploadManager();
    window.uploadManager = uploadManager;
});
