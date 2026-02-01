"""
Gestión centralizada de modelos de clustering
"""
import json
import os
from typing import Optional, Dict, Any
from clustering.clustering_online import LinksClusterCapacityOnline
from utils.helpers import get_data_paths


class ClusteringModels:
    """
    Clase singleton para gestionar todos los modelos de clustering
    """
    _instance = None
    _models: Dict[str, Optional[LinksClusterCapacityOnline]] = {}
    _capacities: Dict[str, Optional[list]] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Inicializa los modelos"""
        self._models = {
            "moments": None,
            "hu": None,
            "zernike": None,
            "sift": None,
            "hog": None,
            "cnn": None,
        }
        self._capacities = {
            "moments": None,
            "hu": None,
            "zernike": None,
            "sift": None,
            "hog": None,
            "cnn": None,
        }
    
    def get_model(self, model_type: str, capacities: list = None) -> LinksClusterCapacityOnline:
        """
        Obtiene o crea un modelo de clustering del tipo especificado
        """
        if model_type not in self._models:
            raise ValueError(f"Tipo de modelo no válido: {model_type}")
        
        # Si se proporcionan nuevas capacidades o no existe el modelo, crear uno nuevo
        if (capacities and self._capacities[model_type] != capacities) or self._models[model_type] is None:
            self._models[model_type] = LinksClusterCapacityOnline(capacities=capacities)
            self._capacities[model_type] = capacities
        
        return self._models[model_type]
    
    def reset_model(self, model_type: str):
        """Resetea un modelo específico"""
        if model_type in self._models:
            self._models[model_type] = None
            self._capacities[model_type] = None
    
    def has_active_model(self, model_type: str) -> bool:
        """Verifica si un modelo está activo"""
        return self._models.get(model_type) is not None
    
    def get_model_info(self, model_type: str) -> Dict[str, Any]:
        """Obtiene información del modelo"""
        model = self._models.get(model_type)
        if not model:
            return {"active": False}
        
        return {
            "active": True,
            "num_clusters": len(model.clusters),
            "capacities": model.capacities,
            "current_counts": model.cluster_counts,
            "available_spaces": [
                cap - count for cap, count in zip(model.capacities, model.cluster_counts)
            ]
        }
    
    def update_capacities(self, model_type: str, new_capacities: list) -> Dict[str, Any]:
        """Actualiza las capacidades de un modelo"""
        model = self._models.get(model_type)
        if not model:
            raise ValueError(f"No hay modelo activo para {model_type}")
        
        if len(new_capacities) != len(model.capacities):
            raise ValueError(
                f"Debe proporcionar {len(model.capacities)} capacidades "
                f"(tienes {len(model.clusters)} clusters)"
            )
        
        model.capacities = new_capacities
        self._capacities[model_type] = new_capacities
        
        return {
            "status": "ok",
            "new_capacities": new_capacities,
            "current_counts": model.cluster_counts,
            "available_spaces": [
                cap - count for cap, count in zip(new_capacities, model.cluster_counts)
            ]
        }
    
    def save_state(self, model_type: str):
        """Guarda el estado de un modelo"""
        model = self._models.get(model_type)
        if not model:
            return
        
        paths = get_data_paths()
        state_file = paths[f"cluster_state_file_{model_type}"] if model_type != "moments" else paths["cluster_state_file"]
        
        try:
            with open(state_file, "w", encoding="utf-8") as f:
                json.dump(model.to_dict(), f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error guardando estado de {model_type}: {e}")
    
    def load_state(self, model_type: str) -> bool:
        """Carga el estado de un modelo desde archivo"""
        paths = get_data_paths()
        state_file = paths[f"cluster_state_file_{model_type}"] if model_type != "moments" else paths["cluster_state_file"]
        
        if not os.path.exists(state_file):
            return False
        
        try:
            with open(state_file, "r", encoding="utf-8") as f:
                state_data = json.load(f)
            
            # Recrear modelo desde el estado guardado
            self._models[model_type] = LinksClusterCapacityOnline.from_dict(state_data)
            self._capacities[model_type] = self._models[model_type].capacities
            return True
        except Exception as e:
            print(f"Error cargando estado de {model_type}: {e}")
            return False


# Instancia global singleton
clustering_models = ClusteringModels()