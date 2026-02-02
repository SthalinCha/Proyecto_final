// Utilities

// API base URL
const API_URL = '';

// Mostrar toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Cerrar al hacer clic
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        removeToast(toast);
    }, 5000);
}

function removeToast(toast) {
    toast.classList.add('removing');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// Formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'Fecha desconocida';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Validar tipo de archivo
function validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no válido: ${file.name}. Solo se permiten JPG, JPEG y PNG.`);
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        throw new Error(`Archivo demasiado grande: ${file.name}. Tamaño máximo: 10MB.`);
    }
    
    return true;
}

// Obtener nombre base de archivo (sin extensión)
function getBaseName(filename) {
    return filename.split('.').slice(0, -1).join('.');
}

// Generar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Hacer petición HTTP
async function fetchAPI(url, options = {}) {
    try {
        const response = await fetch(API_URL + url, {
            ...options,
            headers: {
                ...options.headers
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Subir imágenes al backend
async function uploadImages(files) {
    const formData = new FormData();
    
    // Agregar todos los archivos al FormData
    for (const file of files) {
        formData.append('files', file);
    }
    
    try {
        const response = await fetch(API_URL + '/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Error al subir imágenes');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
}

// Obtener todas las imágenes
async function getAllImages() {
    try {
        return await fetchAPI('/images');
    } catch (error) {
        console.error('Error getting images:', error);
        return [];
    }
}

// Eliminar todas las imágenes
async function deleteAllImages() {
    try {
        await fetchAPI('/images', { method: 'DELETE' });
        return true;
    } catch (error) {
        console.error('Error deleting images:', error);
        throw error;
    }
}

// Obtener datos de la galería
async function getGalleryData() {
    try {
        const data = await fetchAPI('/gallery');
        return data.images || [];
    } catch (error) {
        console.error('Error getting gallery data:', error);
        return [];
    }
}
