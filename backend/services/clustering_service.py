"""
Servicio para lógica de clustering
"""
import numpy as np
from typing import Dict, Any, List, Optional
from models.clustering_models import clustering_models
from utils.helpers import parse_capacities


class ClusteringService:
    """
    Servicio para manejar la lógica de clustering
    """
    
    @staticmethod
    def initialize_clustering(
        model_type: str,
        capacities: Optional[str] = None,
        clusters: Optional[int] = None,
        reset: bool = False
    ) -> List[int]:
        """
        Inicializa un modelo de clustering con capacidades o número de clusters
        """
        if reset or capacities or clusters:
            clustering_models.reset_model(model_type)
        
        if capacities is None and clusters is None:
            raise ValueError("Debes indicar capacities o número de clusters")
        
        if capacities:
            try:
                caps = parse_capacities(capacities)
            except Exception as exc:
                raise ValueError(f"capacities inválido: {exc}")
        else:
            try:
                k = int(clusters) if clusters is not None else 0
            except Exception as exc:
                raise ValueError(f"clusters inválido: {exc}")
            if k <= 0:
                raise ValueError("clusters inválido")
            caps = [100] * k
        
        return caps
    
    @staticmethod
    def predict_cluster(model_type: str, vector, allow_new_clusters: bool = True, true_label: int = None) -> tuple:
        """
        Predice el cluster para un vector dado
        """
        model = clustering_models._models.get(model_type)
        if not model:
            raise ValueError(f"No hay modelo activo para {model_type}")
        
        # Convertir vector a numpy array si no lo es
        if not isinstance(vector, np.ndarray):
            vector = np.array(vector, dtype=float)
        
        cluster_id, centroid = model.predict_with_centroid(
            vector,
            allow_new_clusters=allow_new_clusters,
            true_label=true_label
        )
        
        return cluster_id, centroid
    
    @staticmethod
    def get_metrics(model_type: str) -> Dict[str, Any]:
        """
        Calcula métricas completas de evaluación del clustering
        Incluye métricas internas (Dunn, Silhouette) y externas (NMI, ARI, AMI) si hay etiquetas
        """
        model = clustering_models._models.get(model_type)
        if not model:
            raise ValueError(f"No hay modelo activo para {model_type}")
        
        # Obtener métricas completas del modelo
        comprehensive_metrics = model.get_comprehensive_metrics()
        
        # Redondear valores para mejor presentación
        result = {
            "internal_metrics": {
                "dunn_index": round(comprehensive_metrics["internal_metrics"]["dunn_index"], 4),
                "silhouette_coefficient": round(comprehensive_metrics["internal_metrics"]["silhouette_coefficient"], 4)
            },
            "cluster_info": comprehensive_metrics["cluster_info"]
        }
        
        # Agregar métricas externas si están disponibles
        external = comprehensive_metrics["external_metrics"]
        if external.get("available", True):  # Si no tiene 'available', asumimos que sí están
            if "nmi" in external:
                result["external_metrics"] = {
                    "nmi": round(external["nmi"], 4),
                    "ari": round(external["ari"], 4),
                    "ami": round(external["ami"], 4)
                }
            else:
                result["external_metrics"] = external
        else:
            result["external_metrics"] = external
        
        return result
    
    @staticmethod
    def save_model_state(model_type: str):
        """
        Guarda el estado del modelo
        """
        clustering_models.save_state(model_type)
    
    @staticmethod
    def load_model_state(model_type: str) -> bool:
        """
        Carga el estado del modelo
        """
        return clustering_models.load_state(model_type)
    
    @staticmethod
    def get_model_status(model_type: str) -> Dict[str, Any]:
        """
        Obtiene el estado actual del modelo
        """
        # Intentar cargar desde archivo si no está activo
        if not clustering_models.has_active_model(model_type):
            clustering_models.load_state(model_type)
        
        return clustering_models.get_model_info(model_type)
    
    @staticmethod
    def update_model_capacities(model_type: str, capacities: str) -> Dict[str, Any]:
        """
        Actualiza las capacidades de un modelo existente
        """
        # Intentar cargar desde archivo si no está activo
        if not clustering_models.has_active_model(model_type):
            if not clustering_models.load_state(model_type):
                raise ValueError(f"No hay modelo activo para {model_type}. Ejecuta /analyze-{model_type} primero")
        
        try:
            new_caps = parse_capacities(capacities)
            result = clustering_models.update_capacities(model_type, new_caps)
            
            # Guardar estado actualizado
            clustering_models.save_state(model_type)
            
            # Agregar métricas
            metrics = ClusteringService.get_metrics(model_type)
            result["metrics"] = metrics
            
            return result
        except Exception as exc:
            raise ValueError(str(exc))
    
    @staticmethod
    def ensure_model_exists(model_type: str, error_message: str = None):
        """
        Verifica que existe un modelo activo, intenta cargarlo si no
        """
        if not clustering_models.has_active_model(model_type):
            if not clustering_models.load_state(model_type):
                if not error_message:
                    error_message = f"No hay modelo de clustering activo. Usa /analyze-{model_type} primero"
                raise ValueError(error_message)


# Instancia global del servicio
clustering_service = ClusteringService()