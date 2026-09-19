import json
import os
from typing import Dict, Any, Optional

# Use a local store for testing. In production, this would be an S3 bucket or DynamoDB table.
STORE_DIR = os.environ.get("API_STORE_DIR", os.path.join(os.path.dirname(__file__), "..", "data", "api_store"))

class Storage:
    @staticmethod
    def _ensure_dir():
        if not os.path.exists(STORE_DIR):
            os.makedirs(STORE_DIR, exist_ok=True)
            
    @staticmethod
    def _get_path(simulation_id: str) -> str:
        return os.path.join(STORE_DIR, f"{simulation_id}.json")

    @classmethod
    def save_simulation(cls, simulation_id: str, data: Dict[str, Any]) -> bool:
        cls._ensure_dir()
        try:
            with open(cls._get_path(simulation_id), 'w') as f:
                json.dump(data, f)
            return True
        except Exception as e:
            print(f"Error saving to storage: {e}")
            return False

    @classmethod
    def get_simulation(cls, simulation_id: str) -> Optional[Dict[str, Any]]:
        path = cls._get_path(simulation_id)
        if not os.path.exists(path):
            return None
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading from storage: {e}")
            return None
