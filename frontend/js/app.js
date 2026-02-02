// Main application logic

class App {
    constructor() {
        this.currentView = 'gallery';
        this.initializeNavigation();
    }
    
    initializeNavigation() {
        // Habilitar Momentos primero
        const momentsNav = document.querySelector('.nav-item[data-view="moments"]');
        if (momentsNav) {
            momentsNav.classList.remove('disabled');
        }
        
        // Navegación del sidebar - Usar delegación de eventos
        document.querySelector('.sidebar-nav')?.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            
            if (!navItem || navItem.classList.contains('disabled')) {
                return;
            }
            
            e.preventDefault();
            
            // Actualizar estado activo en el menú
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            navItem.classList.add('active');
            
            const viewName = navItem.dataset.view;
            this.switchView(viewName);
        });
    }
    
    switchView(viewName) {
        // Ocultar todas las vistas
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.classList.remove('active'));
        
        // Mostrar vista seleccionada
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
            console.log('Vista activa:', viewName);
        }
    }
}

// Inicializar aplicación
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    console.log('Sistema de Análisis de Imágenes v2.0.0 iniciado');
});
