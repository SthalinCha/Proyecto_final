// ===== CONSTANTES ===== 
const API_BASE_URL = 'http://localhost:8000/api';
const IMAGE_BASE_URL = 'http://localhost:8000';

// ===== UTILIDADES GENERALES =====
const utils = {
    // Formatear tamaño de archivo
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Validar tipo de archivo
    validateFileType(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        return allowedTypes.includes(file.type);
    },

    // Validar tamaño de archivo (máximo 10MB)
    validateFileSize(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        return file.size <= maxSize;
    },

    // Generar UUID simple
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // Debounce para búsquedas
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Mostrar toast notification
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠';
        
        toast.innerHTML = `
            <span class="icon">${icon}</span>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        container.appendChild(toast);
        
        // Mostrar toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto-remove después de 5 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    // Realizar petición HTTP
    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return await response.text();
        } catch (error) {
            console.error('Request error:', error);
            throw error;
        }
    },

    // Crear FormData para subida de archivos
    createFormData(files, data = {}) {
        const formData = new FormData();
        
        // Agregar archivos
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });
        
        // Agregar datos adicionales
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        
        return formData;
    },

    // Manejar errores de manera consistente
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        let message = 'Ha ocurrido un error inesperado';
        
        if (error.message.includes('Failed to fetch')) {
            message = 'Error de conexión. Verifica que el servidor esté ejecutándose.';
        } else if (error.message.includes('HTTP error')) {
            message = `Error del servidor: ${error.message}`;
        } else if (error.message) {
            message = error.message;
        }
        
        this.showToast(message, 'error');
        return message;
    },

    // Cargar imagen desde URL con manejo de errores
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    },

    // Obtener color dominante de una imagen (simplificado)
    getDominantColor(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 1;
        canvas.height = 1;
        
        ctx.drawImage(imageElement, 0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        
        return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
    },

    // Capitalizar primera letra
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Truncar texto
    truncate(str, length = 50) {
        return str.length > length ? str.substring(0, length) + '...' : str;
    }
};

// Exportar para uso en otros módulos
window.utils = utils;
window.API_BASE_URL = API_BASE_URL;
window.IMAGE_BASE_URL = IMAGE_BASE_URL;