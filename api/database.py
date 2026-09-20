import os
import boto3
from decimal import Decimal
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

AWS_ENDPOINT = os.environ.get("AWS_ENDPOINT_URL")

# Table names
SESSIONS_TABLE = os.environ.get("DYNAMODB_SESSIONS_TABLE", "SmartCharge_EVSessions")
FORECASTS_TABLE = os.environ.get("DYNAMODB_FORECASTS_TABLE", "SmartCharge_GridForecasts")
CHARGERS_TABLE = os.environ.get("DYNAMODB_CHARGERS_TABLE", "SmartCharge_ChargerInfrastructure")
ALERTS_TABLE = os.environ.get("DYNAMODB_ALERTS_TABLE", "SmartCharge_Alerts")

def _get_dynamodb():
    return boto3.resource(
        'dynamodb',
        endpoint_url=AWS_ENDPOINT,
        region_name='ap-south-1'
    )

def dict_to_item(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: dict_to_item(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [dict_to_item(x) for x in obj]
    return obj

def item_to_dict(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: item_to_dict(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [item_to_dict(x) for x in obj]
    return obj

class Database:
    @staticmethod
    def save_ev_session(session_data: Dict[str, Any]) -> str:
        dynamodb = _get_dynamodb()
        table = dynamodb.Table(SESSIONS_TABLE)
        
        session_id = session_data.get('session_id', str(uuid.uuid4()))
        session_data['session_id'] = session_id
        session_data['updated_at'] = datetime.utcnow().isoformat()
        
        table.put_item(Item=dict_to_item(session_data))
        return session_id

    @staticmethod
    def get_ev_session(session_id: str) -> Optional[Dict[str, Any]]:
        dynamodb = _get_dynamodb()
        table = dynamodb.Table(SESSIONS_TABLE)
        
        response = table.get_item(Key={'session_id': session_id})
        if 'Item' in response:
            return item_to_dict(response['Item'])
        return None

    @staticmethod
    def get_active_sessions() -> List[Dict[str, Any]]:
        dynamodb = _get_dynamodb()
        table = dynamodb.Table(SESSIONS_TABLE)
        
        # In production, use an index for 'status'. Using scan for simplicity in MVP.
        response = table.scan(
            FilterExpression="session_status = :status",
            ExpressionAttributeValues={":status": "ACTIVE"}
        )
        return item_to_dict(response.get('Items', []))

    @staticmethod
    def save_charger(charger_data: Dict[str, Any]) -> str:
        dynamodb = _get_dynamodb()
        table = dynamodb.Table(CHARGERS_TABLE)
        
        charger_id = charger_data.get('charger_id', str(uuid.uuid4()))
        charger_data['charger_id'] = charger_id
        
        table.put_item(Item=dict_to_item(charger_data))
        return charger_id

    @staticmethod
    def save_forecast(forecast_id: str, forecast_data: Dict[str, Any]):
        dynamodb = _get_dynamodb()
        table = dynamodb.Table(FORECASTS_TABLE)
        
        forecast_data['forecast_id'] = forecast_id
        forecast_data['created_at'] = datetime.utcnow().isoformat()
        
        table.put_item(Item=dict_to_item(forecast_data))

    @staticmethod
    def save_alert(alert_data: Dict[str, Any]) -> str:
        dynamodb = _get_dynamodb()
        table = dynamodb.Table(ALERTS_TABLE)
        
        alert_id = alert_data.get('alert_id', str(uuid.uuid4()))
        alert_data['alert_id'] = alert_id
        alert_data['timestamp'] = datetime.utcnow().isoformat()
        if 'status' not in alert_data:
            alert_data['status'] = 'ACTIVE'
            
        table.put_item(Item=dict_to_item(alert_data))
        return alert_id

    @staticmethod
    def get_alerts() -> List[Dict[str, Any]]:
        dynamodb = _get_dynamodb()
        table = dynamodb.Table(ALERTS_TABLE)
        
        # Simplistic scan for MVP. In prod use index.
        response = table.scan(
            FilterExpression="#st = :status",
            ExpressionAttributeNames={"#st": "status"},
            ExpressionAttributeValues={":status": "ACTIVE"}
        )
        return item_to_dict(response.get('Items', []))
