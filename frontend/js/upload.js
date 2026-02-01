// ===== UPLOAD MODULE - MEJORADO =====
const uploadModule = {
    // Estados del módulo
    state: {
        selectedFiles: [],
        currentMethod: 'moments',
        hasLabels: false,
        isUploading: false
    },

    // Referencias DOM
    elements: {
        modal: null,
        form: null,
        fileInput: null,
        uploadArea: null,
        filesPreview: null,
        labelsSection: null,
        filesWithLabels: null,
        progressSection: null,
        progressFill: null,
        progressText: null,
        submitBtn: null
    },

    // Inicializar el módulo
    init() {
        this.bindElements();
        this.attachEvents();
    },

    // Vincular elementos DOM
    bindElements() {
        this.elements = {
            modal: document.getElementById('upload-modal'),
            form: document.getElementById('upload-form'),
            fileInput: document.getElementById('file-input'),
            uploadArea: document.getElementById('upload-area'),
            filesPreview: document.getElementById('files-preview'),
            labelsSection: document.getElementById('labels-section'),
            filesWithLabels: document.getElementById('files-with-labels'),
            progressSection: document.getElementById('upload-progress'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            submitBtn: document.getElementById('submit-upload')
        };
    },

    // Adjuntar eventos
    attachEvents() {
        // Botón de abrir modal
        document.getElementById('upload-btn').addEventListener('click', () => {
            this.openModal();
        });

        // Botones de cerrar modal
        document.getElementById('upload-modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-upload').addEventListener('click', () => {
            this.closeModal();
        });

        // Click fuera del modal
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.closeModal();
            }
        });

        // Formulario
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processUpload();
        });

        // Cambio de método
        document.getElementById('analysis-method').addEventListener('change', (e) => {
            this.state.currentMethod = e.target.value;
        });

        // Checkbox de etiquetas
        document.getElementById('has-labels').addEventListener('change', (e) => {
            this.state.hasLabels = e.target.checked;
            this.toggleLabelsSection();
        });

        // Área de subida de archivos
        this.elements.uploadArea.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        // Botón de examinar
        document.getElementById('browse-files').addEventListener('click', (e) => {
            e.stopPropagation();
            this.elements.fileInput.click();
        });

        // Input de archivos
        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // DRAG & DROP MEJORADO
        this.setupDragAndDrop();

        // ESC key para cerrar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.modal.classList.contains('show')) {
                this.closeModal();
            }
        });
    },

    // Configurar Drag & Drop
    setupDragAndDrop() {
        // Prevenir comportamiento por defecto en toda la ventana
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // Eventos específicos del área de subida
        this.elements.uploadArea.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.elements.uploadArea.classList.add('drag-over');
        });

        this.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.elements.uploadArea.classList.add('drag-over');
        });

        this.elements.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Solo remover si realmente salimos del área
            const rect = this.elements.uploadArea.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX >= rect.right || 
                e.clientY < rect.top || e.clientY >= rect.bottom) {
                this.elements.uploadArea.classList.remove('drag-over');
            }
        });

        this.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.elements.uploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files);
                utils.showToast(`${files.length} archivo(s) arrastrado(s)`, 'success');
            }
        });
    },

    // Abrir modal de subida
    openModal() {
        this.resetForm();
        this.elements.modal.style.display = 'flex';
        setTimeout(() => {
            this.elements.modal.classList.add('show');
        }, 10);
    },

    // Cerrar modal
    closeModal() {
        this.elements.modal.classList.remove('show');
        setTimeout(() => {
            this.elements.modal.style.display = 'none';
            this.resetForm();
        }, 300);
    },

    // Resetear formulario
    resetForm() {
        this.state.selectedFiles = [];
        this.state.hasLabels = false;
        this.state.isUploading = false;
        
        this.elements.form.reset();
        this.elements.fileInput.value = '';
        this.elements.filesPreview.innerHTML = '';
        this.elements.labelsSection.style.display = 'none';
        this.elements.progressSection.style.display = 'none';
        this.elements.submitBtn.disabled = true;
        this.elements.uploadArea.classList.remove('drag-over');
        
        document.getElementById('has-labels').checked = false;
    },

    // Manejar selección de archivos
    handleFileSelection(files) {
        const validFiles = [];
        
        Array.from(files).forEach(file => {
            if (!utils.validateFileType(file)) {
                utils.showToast(`"${file.name}" no es un formato válido de imagen`, 'error');
                return;
            }
            
            if (!utils.validateFileSize(file)) {
                utils.showToast(`"${file.name}" excede el tamaño máximo de 10MB`, 'error');
                return;
            }
            
            validFiles.push(file);
        });
        
        if (validFiles.length > 0) {
            this.state.selectedFiles = validFiles;
            this.renderFilesPreviews();
            this.updateSubmitButton();
            
            if (this.state.hasLabels) {
                this.renderLabelsSection();
            }
            
            utils.showToast(`${validFiles.length} imagen(es) cargada(s) exitosamente`, 'success');
        }
    },

    // Renderizar vista previa de archivos
    renderFilesPreviews() {
        this.elements.filesPreview.innerHTML = '';
        
        this.state.selectedFiles.forEach((file, index) => {
            const previewElement = document.createElement('div');
            previewElement.className = 'file-preview';
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.alt = file.name;
            img.onload = () => URL.revokeObjectURL(img.src); // Limpiar memoria
            
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = utils.truncate(file.name, 20);
            fileName.title = file.name; // Tooltip con nombre completo
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'file-remove';
            removeBtn.innerHTML = '×';
            removeBtn.title = 'Eliminar archivo';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                this.removeFile(index);
            };
            
            previewElement.appendChild(img);
            previewElement.appendChild(fileName);
            previewElement.appendChild(removeBtn);
            
            this.elements.filesPreview.appendChild(previewElement);
        });
    },

    // Remover archivo
    removeFile(index) {
        const fileName = this.state.selectedFiles[index].name;
        this.state.selectedFiles.splice(index, 1);
        this.renderFilesPreviews();
        this.updateSubmitButton();
        
        if (this.state.hasLabels) {
            this.renderLabelsSection();
        }
        
        utils.showToast(`Archivo "${utils.truncate(fileName, 30)}" eliminado`, 'warning');
    },

    // Alternar sección de etiquetas
    toggleLabelsSection() {
        if (this.state.hasLabels && this.state.selectedFiles.length > 0) {
            this.elements.labelsSection.style.display = 'block';
            this.renderLabelsSection();
        } else {
            this.elements.labelsSection.style.display = 'none';
        }
    },

    // Renderizar sección de etiquetas
    renderLabelsSection() {
        this.elements.filesWithLabels.innerHTML = '';
        
        this.state.selectedFiles.forEach((file, index) => {
            const labelItem = document.createElement('div');
            labelItem.className = 'file-label-item';
            
            labelItem.innerHTML = `
                <img src="${URL.createObjectURL(file)}" alt="${file.name}" class="file-label-thumbnail">
                <span class="file-label-name" title="${file.name}">${utils.truncate(file.name, 20)}</span>
                <input type="text" class="file-label-input" placeholder="Etiqueta" data-file-index="${index}">
            `;
            
            this.elements.filesWithLabels.appendChild(labelItem);
        });
    },

    // Actualizar estado del botón de envío
    updateSubmitButton() {
        const hasFiles = this.state.selectedFiles.length > 0;
        const notUploading = !this.state.isUploading;
        
        this.elements.submitBtn.disabled = !hasFiles || !notUploading;
        
        // Actualizar texto del botón
        if (this.state.isUploading) {
            this.elements.submitBtn.innerHTML = '<span class="icon">⏳</span> Procesando...';
        } else {
            this.elements.submitBtn.innerHTML = '<span class="icon">🚀</span> Procesar Imágenes';
        }
    },

    // Procesar subida
    async processUpload() {
        if (this.state.isUploading || this.state.selectedFiles.length === 0) {
            return;
        }
        
        this.state.isUploading = true;
        this.updateSubmitButton();
        this.showProgress();
        
        try {
            // Preparar datos
            const formData = new FormData();
            
            // Agregar archivos
            this.state.selectedFiles.forEach(file => {
                formData.append('files', file);
            });
            
            // Agregar configuración
            const numClusters = document.getElementById('num-clusters').value;
            if (numClusters) {
                formData.append('clusters', numClusters);
            }
            
            // Agregar etiquetas si están habilitadas
            if (this.state.hasLabels) {
                const labels = this.getFileLabels();
                labels.forEach((label, index) => {
                    if (label.trim()) {
                        formData.append(`label_${index}`, label.trim());
                    }
                });
            }
            
            // Determinar endpoint
            const endpoint = `${API_BASE_URL}/${this.state.currentMethod}/analyze`;
            
            console.log('Enviando request a:', endpoint);
            
            // Realizar petición
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Respuesta del servidor:', result);
            
            // Progreso completo
            this.updateProgress(100, 'Procesamiento completado');
            
            // Mostrar éxito
            const processedCount = result.results?.length || this.state.selectedFiles.length;
            utils.showToast(`¡Procesamiento completado! ${processedCount} imágenes procesadas.`, 'success');
            
            // Cerrar modal después de un momento
            setTimeout(() => {
                this.closeModal();
                // Recargar galería
                if (window.galleryModule) {
                    window.galleryModule.loadImages();
                }
            }, 1500);
            
        } catch (error) {
            console.error('Error en upload:', error);
            utils.handleError(error, 'procesamiento de imágenes');
            this.hideProgress();
        } finally {
            this.state.isUploading = false;
            this.updateSubmitButton();
        }
    },

    // Obtener etiquetas de archivos
    getFileLabels() {
        const labels = [];
        const inputs = this.elements.filesWithLabels.querySelectorAll('.file-label-input');
        
        inputs.forEach(input => {
            labels.push(input.value || '');
        });
        
        return labels;
    },

    // Mostrar progreso
    showProgress() {
        this.elements.progressSection.style.display = 'block';
        this.updateProgress(0, 'Iniciando procesamiento...');
        
        // Simular progreso realista
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10 + 5; // Entre 5-15% cada vez
            if (progress >= 90) {
                clearInterval(interval);
                this.updateProgress(90, 'Finalizando procesamiento...');
            } else {
                const messages = [
                    'Procesando imágenes...',
                    'Extrayendo características...',
                    'Aplicando clustering...',
                    'Generando versiones procesadas...'
                ];
                const message = messages[Math.floor(Math.random() * messages.length)];
                this.updateProgress(progress, message);
            }
        }, 800);
        
        this.progressInterval = interval;
    },

    // Actualizar progreso
    updateProgress(percentage, text) {
        this.elements.progressFill.style.width = `${Math.min(percentage, 100)}%`;
        this.elements.progressText.textContent = text;
    },

    // Ocultar progreso
    hideProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        this.elements.progressSection.style.display = 'none';
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => uploadModule.init());
} else {
    uploadModule.init();
}

// Exportar módulo
window.uploadModule = uploadModule;