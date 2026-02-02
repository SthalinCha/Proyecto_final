/**
 * Módulo de Momentos - Clustering automático de imágenes de galería
 */

// Estado del módulo
const momentsState = {
    configured: false,
    numClusters: 0,
    capacities: [],
    clusteringActive: false
};

// Inicializar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initMomentsEvents();
    updateGalleryCount(); // Cargar contador al inicio
});

/**
 * Actualizar contador de imágenes de la galería
 */
async function updateGalleryCount() {
    try {
        const response = await fetch('/gallery');
        if (response.ok) {
            const data = await response.json();
            const total = data.total || 0;
            
            const counterSpan = document.getElementById('moments-total-images');
            if (counterSpan) {
                counterSpan.textContent = total;
                
                // Añadir clase visual si hay imágenes
                const statusCard = counterSpan.closest('.status-card');
                if (statusCard) {
                    if (total > 0) {
                        statusCard.classList.add('has-images');
                    } else {
                        statusCard.classList.remove('has-images');
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error al actualizar contador:', error);
    }
}

/**
 * Inicializar eventos del módulo
 */
function initMomentsEvents() {
    // Botón de configurar (en el panel de configuración)
    const initBtn = document.getElementById('init-clustering-btn');
    if (initBtn) {
        initBtn.addEventListener('click', saveConfiguration);
    }

    // Botón refrescar contador
    const refreshBtn = document.getElementById('refresh-gallery-count');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', updateGalleryCount);
    }

    // Botones de acciones
    document.getElementById('init-clustering-btn-action')?.addEventListener('click', initializeClusteringAuto);
    document.getElementById('add-images-btn')?.addEventListener('click', openAddImagesModal);
    document.getElementById('update-restrictions-btn')?.addEventListener('click', updateRestrictions);
    document.getElementById('view-cluster-status-btn')?.addEventListener('click', viewClusterStatus);
    document.getElementById('clear-clustering-btn')?.addEventListener('click', clearClustering);

    // Modal de agregar imágenes
    setupAddImagesModal();

    // Sincronizar capacidades con número de clusters
    const numClustersInput = document.getElementById('num-clusters');
    numClustersInput?.addEventListener('input', updateCapacitiesPlaceholder);
}

/**
 * Guardar configuración y habilitar botones
 */
function saveConfiguration() {
    const numClusters = parseInt(document.getElementById('num-clusters').value);
    const capacitiesInput = document.getElementById('cluster-capacities').value.trim();

    // Validar número de clusters
    if (!numClusters || numClusters < 1) {
        showToast('Por favor, ingresa un número válido de clusters', 'error');
        return;
    }

    // Validar capacidades
    let capacities = [];
    if (capacitiesInput) {
        try {
            capacities = capacitiesInput.split(',').map(c => {
                const num = parseInt(c.trim());
                if (isNaN(num) || num < 1) {
                    throw new Error('Capacidad inválida');
                }
                return num;
            });

            if (capacities.length !== numClusters) {
                showToast(`El número de capacidades (${capacities.length}) no coincide con el número de clusters (${numClusters})`, 'error');
                return;
            }
        } catch (error) {
            showToast('Formato de capacidades inválido. Usa: 10,20,5', 'error');
            return;
        }
    } else {
        // Capacidades por defecto
        capacities = Array(numClusters).fill(100);
    }

    // Guardar configuración
    momentsState.configured = true;
    momentsState.numClusters = numClusters;
    momentsState.capacities = capacities;

    // Habilitar botones de acción
    enableActionButtons();

    const totalCapacity = capacities.reduce((sum, cap) => sum + cap, 0);
    showToast(`✓ Configuración guardada: ${numClusters} clusters con capacidades [${capacities.join(', ')}] = ${totalCapacity} imágenes totales`, 'success');
}

/**
 * Habilitar botones de acción
 */
function enableActionButtons() {
    const buttons = [
        'init-clustering-btn-action',
        'add-images-btn',
        'update-restrictions-btn',
        'view-cluster-status-btn',
        'clear-clustering-btn'
    ];
    
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.remove('disabled');
        }
    });
}

/**
 * Deshabilitar botones de acción
 */
function disableActionButtons() {
    const buttons = [
        'init-clustering-btn-action',
        'add-images-btn',
        'update-restrictions-btn',
        'view-cluster-status-btn',
        'clear-clustering-btn'
    ];
    
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.add('disabled');
        }
    });
}

/**
 * Verificar imágenes en galería
 */
async function checkGalleryImages() {
    await updateGalleryCount(); // Usar la nueva función
    
    const response = await fetch('/gallery');
    if (response.ok) {
        const data = await response.json();
        const total = data.total || 0;
        
        const infoSection = document.getElementById('gallery-info-section');
        const totalSpan = document.getElementById('total-gallery-images');
        
        if (infoSection && totalSpan && total > 0) {
            infoSection.style.display = 'block';
            totalSpan.textContent = total;
        }
    }
}

/**
 * Inicializar clustering automático con todas las imágenes de galería
 */
async function initializeClusteringAuto() {
    if (!momentsState.configured) {
        showToast('Debes guardar la configuración primero', 'warning');
        return;
    }

    try {
        showToast('Obteniendo imágenes de la galería...', 'info');
        
        // Obtener todas las imágenes de la galería
        const response = await fetch('/gallery');
        if (!response.ok) {
            throw new Error('Error al obtener imágenes de la galería');
        }

        const data = await response.json();
        const images = data.items || [];

        if (images.length === 0) {
            showToast('No hay imágenes en la galería. Sube algunas primero en la sección Galería.', 'warning');
            return;
        }

        // Validar capacidad total vs número de imágenes
        const totalCapacity = momentsState.capacities.reduce((sum, cap) => sum + cap, 0);
        if (images.length > totalCapacity) {
            showToast(
                `⚠️ Capacidad insuficiente: Tienes ${images.length} imágenes pero la capacidad total es ${totalCapacity}. ` +
                `Aumenta las capacidades o reduce el número de imágenes.`,
                'error'
            );
            return;
        }

        showToast(`Procesando ${images.length} imágenes...`, 'info');

        // Descargar las imágenes binarias
        const formData = new FormData();
        
        for (const img of images) {
            const imgResponse = await fetch(img.binarized_url);
            const blob = await imgResponse.blob();
            const filename = img.binarized_url.split('/').pop();
            formData.append('files', blob, filename);
        }

        // Agregar configuración
        formData.append('clusters', momentsState.numClusters);
        formData.append('capacities', momentsState.capacities.join(','));
        formData.append('reset', 'true');

        // Ejecutar clustering
        const clusterResponse = await fetch('/api/moments/analyze', {
            method: 'POST',
            body: formData
        });

        if (!clusterResponse.ok) {
            const error = await clusterResponse.json();
            throw new Error(error.detail || 'Error al ejecutar clustering');
        }

        const result = await clusterResponse.json();
        
        momentsState.clusteringActive = true;
        
        showToast(`✓ Clustering completado: ${images.length} imágenes procesadas`, 'success');
        
        // Mostrar resultados y métricas
        displayClusteringResults(result.results);
        
        // Obtener y mostrar estado con métricas
        await viewClusterStatus();

    } catch (error) {
        console.error('Error:', error);
        
        // Mejorar mensaje de error
        let errorMessage = error.message;
        if (errorMessage.includes('Capacidad excedida')) {
            errorMessage = '⚠️ ' + errorMessage + '\n\nSoluciones:\n• Aumenta las capacidades de los clusters\n• Elimina algunas imágenes de la galería';
        }
        
        showToast(errorMessage, 'error');
    }
}

/**
 * Configurar modal de agregar imágenes múltiples
 */
function setupAddImagesModal() {
    const modal = document.getElementById('add-images-modal');
    const dropZone = document.getElementById('multi-drop-zone');
    const fileInput = document.getElementById('multi-file-input');
    const previewDiv = document.getElementById('multi-preview');
    const uploadBtn = document.getElementById('multi-upload-btn');
    const uploadCountSpan = document.getElementById('upload-count');
    const cancelBtn = document.getElementById('multi-cancel-btn');
    const closeBtn = modal.querySelector('.modal-close');

    let selectedFiles = [];

    // Cerrar modal
    const closeModal = () => {
        modal.style.display = 'none';
        selectedFiles = [];
        fileInput.value = '';
        previewDiv.innerHTML = '';
        previewDiv.style.display = 'none';
        uploadBtn.disabled = true;
        uploadCountSpan.textContent = '0';
        dropZone.classList.remove('drag-over');
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // ===== DRAG & DROP =====
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            handleFilesSelection(files);
        } else {
            showToast('Por favor, arrastra archivos de imagen válidos', 'error');
        }
    });

    // Selección de archivos
    fileInput?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            handleFilesSelection(files);
        }
    });

    // Función para manejar múltiples archivos
    function handleFilesSelection(files) {
        selectedFiles = files;
        uploadCountSpan.textContent = files.length;
        
        // Mostrar previews
        previewDiv.innerHTML = '';
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item-small';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <p class="preview-filename">${file.name}</p>
                    <p class="preview-size">${formatFileSize(file.size)}</p>
                `;
                previewDiv.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
        
        previewDiv.style.display = 'grid';
        uploadBtn.disabled = false;
    }

    // Subir imágenes
    uploadBtn?.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        try {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '⏳ Subiendo...';

            // Subir a galería
            const uploadForm = new FormData();
            selectedFiles.forEach(file => {
                uploadForm.append('files', file);
            });

            const uploadResponse = await fetch('/upload', {
                method: 'POST',
                body: uploadForm
            });

            if (!uploadResponse.ok) {
                throw new Error('Error al subir imágenes a galería');
            }

            showToast(`✓ ${selectedFiles.length} imágenes agregadas a la galería`, 'success');
            
            // Actualizar contador
            await updateGalleryCount();
            
            // Si hay clustering activo, recalcular todo
            if (momentsState.clusteringActive) {
                closeModal();
                showToast('Recalculando clustering con todas las imágenes...', 'info');
                await initializeClusteringAuto();
            } else {
                closeModal();
                await checkGalleryImages();
            }

        } catch (error) {
            console.error('Error:', error);
            showToast(error.message, 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '⬆️ Subir <span id="upload-count">' + selectedFiles.length + '</span> Imágenes';
        }
    });
}

/**
 * Abrir modal de agregar imágenes
 */
function openAddImagesModal() {
    if (!momentsState.configured) {
        showToast('Debes guardar la configuración primero', 'warning');
        return;
    }
    
    const modal = document.getElementById('add-images-modal');
    modal.style.display = 'flex';
}

/**
 * Actualizar restricciones (capacidades) sin recalcular
 */
async function updateRestrictions() {
    if (!momentsState.configured) {
        showToast('Debes guardar la configuración primero', 'warning');
        return;
    }

    const capacitiesInput = document.getElementById('cluster-capacities').value.trim();
    
    if (!capacitiesInput) {
        showToast('Por favor, ingresa las nuevas capacidades en el campo de configuración', 'warning');
        return;
    }

    try {
        // Validar capacidades
        const capacities = capacitiesInput.split(',').map(c => {
            const num = parseInt(c.trim());
            if (isNaN(num) || num < 1) {
                throw new Error('Capacidad inválida');
            }
            return num;
        });

        if (capacities.length !== momentsState.numClusters) {
            throw new Error(`Debes proporcionar ${momentsState.numClusters} capacidades (tienes ${capacities.length})`);
        }

        // Actualizar capacidades en el backend
        const response = await fetch('/api/moments/update-capacities', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `capacities=${capacities.join(',')}`
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al actualizar capacidades');
        }

        // Actualizar estado local
        momentsState.capacities = capacities;

        const totalCapacity = capacities.reduce((sum, cap) => sum + cap, 0);
        showToast(`✓ Restricciones actualizadas: [${capacities.join(', ')}] = ${totalCapacity} capacidad total`, 'success');
        
        // Mostrar estado actualizado
        await viewClusterStatus();

    } catch (error) {
        console.error('Error:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Ver estado de clusters con métricas
 */
async function viewClusterStatus() {
    if (!momentsState.configured) {
        showToast('Debes guardar la configuración primero', 'warning');
        return;
    }

    if (!momentsState.clusteringActive) {
        showToast('Debes inicializar el clustering primero', 'warning');
        return;
    }

    try {
        showToast('Consultando estado de clusters...', 'info');
        
        const response = await fetch('/api/moments/cluster-status');
        
        if (!response.ok) {
            throw new Error('Error al obtener estado de clusters');
        }

        const status = await response.json();
        
        // Verificar si hay datos
        if (!status || !status.clusters || status.clusters.length === 0) {
            showToast('No hay datos de clustering disponibles. Inicializa primero.', 'warning');
            return;
        }
        
        displayClusterStatus(status);
        
        // Scroll a la sección de estado
        const statusSection = document.getElementById('cluster-status-section');
        if (statusSection) {
            statusSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        showToast('✓ Estado de clusters actualizado', 'success');

    } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'Error al obtener estado de clusters', 'error');
    }
}

/**
 * Borrar todo el clustering
 */
async function clearClustering() {
    if (!momentsState.configured) {
        return;
    }

    if (!confirm('¿Estás seguro de que deseas borrar todo? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        // Resetear estado local
        momentsState.configured = false;
        momentsState.clusteringActive = false;
        momentsState.numClusters = 0;
        momentsState.capacities = [];

        // Deshabilitar botones
        disableActionButtons();

        // Limpiar visualizaciones
        document.getElementById('cluster-status-section').style.display = 'none';
        document.getElementById('clustering-results-section').style.display = 'none';
        document.getElementById('cluster-status-container').innerHTML = '';
        document.getElementById('clustering-results-container').innerHTML = '';

        // Resetear formulario
        document.getElementById('num-clusters').value = '3';
        document.getElementById('cluster-capacities').value = '';

        showToast('Módulo reiniciado correctamente', 'success');

    } catch (error) {
        console.error('Error:', error);
        showToast('Error al reiniciar clustering', 'error');
    }
}

/**
 * Actualizar placeholder de capacidades según número de clusters
 */
function updateCapacitiesPlaceholder() {
    const numClusters = parseInt(document.getElementById('num-clusters').value);
    const capacitiesInput = document.getElementById('cluster-capacities');
    
    if (numClusters > 0) {
        const example = Array(numClusters).fill(10).join(',');
        capacitiesInput.placeholder = `Ej: ${example}`;
    }
}

/**
 * Mostrar estado de clusters con métricas de evaluación
 */
function displayClusterStatus(status) {
    const section = document.getElementById('cluster-status-section');
    const container = document.getElementById('cluster-status-container');
    
    if (!status || !status.clusters) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = '';

    // Mostrar métricas de evaluación si están disponibles
    if (status.metrics) {
        const metricsCard = document.createElement('div');
        metricsCard.className = 'metrics-card';
        metricsCard.innerHTML = `
            <h4>📊 Métricas de Evaluación</h4>
            <div class="metrics-grid">
                ${status.metrics.internal_metrics ? `
                    <div class="metric-item">
                        <span class="metric-label">Dunn Index:</span>
                        <span class="metric-value">${status.metrics.internal_metrics.dunn_index}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Silhouette:</span>
                        <span class="metric-value">${status.metrics.internal_metrics.silhouette_coefficient}</span>
                    </div>
                ` : ''}
                ${status.metrics.external_metrics && !status.metrics.external_metrics.message ? `
                    <div class="metric-item">
                        <span class="metric-label">NMI:</span>
                        <span class="metric-value">${status.metrics.external_metrics.nmi}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">ARI:</span>
                        <span class="metric-value">${status.metrics.external_metrics.ari}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">AMI:</span>
                        <span class="metric-value">${status.metrics.external_metrics.ami}</span>
                    </div>
                ` : ''}
            </div>
        `;
        container.appendChild(metricsCard);
    }

    // Mostrar estado de cada cluster
    status.clusters.forEach((cluster, idx) => {
        const percentage = (cluster.count / cluster.capacity) * 100;
        const statusClass = percentage >= 100 ? 'full' : percentage >= 80 ? 'warning' : 'available';

        const card = document.createElement('div');
        card.className = `cluster-status-card ${statusClass}`;
        card.innerHTML = `
            <div class="cluster-header">
                <h4>Cluster ${idx + 1}</h4>
                <span class="cluster-badge">${cluster.count}/${cluster.capacity}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <div class="cluster-info">
                <p>Espacios disponibles: <strong>${cluster.capacity - cluster.count}</strong></p>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Mostrar resultados del clustering
 */
function displayClusteringResults(results) {
    if (!results || results.length === 0) return;

    const section = document.getElementById('clustering-results-section');
    const container = document.getElementById('clustering-results-container');
    
    section.style.display = 'block';

    // Agrupar por cluster_id
    const clusters = {};
    results.forEach(img => {
        const clusterId = img.cluster_id ?? 0;
        if (!clusters[clusterId]) {
            clusters[clusterId] = [];
        }
        clusters[clusterId].push(img);
    });

    // Limpiar y mostrar
    container.innerHTML = '';

    Object.keys(clusters).sort((a, b) => parseInt(a) - parseInt(b)).forEach(clusterId => {
        const images = clusters[clusterId];
        
        const clusterCard = document.createElement('div');
        clusterCard.className = 'cluster-result-card';
        clusterCard.innerHTML = `
            <div class="cluster-result-header">
                <h4>Cluster ${parseInt(clusterId) + 1}</h4>
                <span class="image-count">${images.length} imagen(es)</span>
            </div>
            <div class="cluster-images-grid">
                ${images.map(img => `
                    <div class="cluster-image-item">
                        <img src="${img.binarized_url}" alt="${img.filename}" loading="lazy">
                        <p class="image-name">${img.filename}</p>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(clusterCard);
    });
}

// Función auxiliar para formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
