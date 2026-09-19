import json
import os
import boto3
from decimal import Decimal
from typing import Dict, Any, Optional
from datetime import datetime

DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE", "SmartChargeSimulations")
S3_BUCKET = os.environ.get("S3_BUCKET", "smartcharge-artifacts")
AWS_ENDPOINT = os.environ.get("AWS_ENDPOINT_URL") # E.g., http://localhost:5000 for moto

# Convert floats to Decimals for DynamoDB
def dict_to_item(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: dict_to_item(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [dict_to_item(x) for x in obj]
    return obj

# Convert Decimals back to floats for Python
def item_to_dict(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: item_to_dict(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [item_to_dict(x) for x in obj]
    return obj

class Storage:
    @staticmethod
    def _get_dynamodb():
        return boto3.resource(
            'dynamodb',
            endpoint_url=AWS_ENDPOINT,
            region_name='us-east-1',
            aws_access_key_id='testing',
            aws_secret_access_key='testing'
        )
        
    @staticmethod
    def _get_s3():
        return boto3.client(
            's3',
            endpoint_url=AWS_ENDPOINT,
            region_name='us-east-1',
            aws_access_key_id='testing',
            aws_secret_access_key='testing'
        )

    @classmethod
    def save_simulation(cls, simulation_id: str, data: Dict[str, Any]) -> bool:
        dynamodb = cls._get_dynamodb()
        table = dynamodb.Table(DYNAMODB_TABLE)
        s3 = cls._get_s3()
        
        try:
            # 1. Save Full Payload to S3
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=f"simulations/{simulation_id}/full_payload.json",
                Body=json.dumps(data)
            )
            
            # 2. Save Metadata to DynamoDB
            metadata = {
                'simulation_id': simulation_id,
                'entity_type': 'METADATA',
                'created_at': datetime.utcnow().isoformat(),
                'scenario': data.get('scenario', 'Unknown'),
                'ev_count': data.get('ev_requests', 0),
                'baseline_peak': data.get('baseline_peak', 0.0),
                'optimized_peak': data.get('optimized_peak', 0.0),
                'peak_reduction': data.get('peak_reduction', 0.0),
                'energy_required': data.get('energy_required', 0.0),
                'energy_delivered': data.get('energy_delivered', 0.0),
                'deadline_compliance': data.get('deadline_compliance', 0.0),
                'grid_compliance': data.get('grid_compliance', False),
                'feasible': data.get('feasible', False),
                'failure_reason': data.get('failure_reason', '')
            }
            table.put_item(Item=dict_to_item(metadata))
            
            # 3. Save EV Schedules (Batch Write)
            schedule = data.get('schedule', {})
            if schedule:
                with table.batch_writer() as batch:
                    for ev_id, powers in schedule.items():
                        batch.put_item(Item=dict_to_item({
                            'simulation_id': simulation_id,
                            'entity_type': f'EV#{ev_id}',
                            'schedule_array': powers
                        }))
            return True
        except Exception as e:
            print(f"AWS Storage Save Error: {e}")
            return False

    @classmethod
    def get_simulation(cls, simulation_id: str) -> Optional[Dict[str, Any]]:
        # Returns the full simulation by querying DynamoDB metadata and schedules
        dynamodb = cls._get_dynamodb()
        table = dynamodb.Table(DYNAMODB_TABLE)
        
        try:
            # Query all items for this simulation (Metadata + all EVs)
            from boto3.dynamodb.conditions import Key
            response = table.query(
                KeyConditionExpression=Key('simulation_id').eq(simulation_id)
            )
            items = response.get('Items', [])
            if not items:
                return None
                
            items = item_to_dict(items)
            
            result = {}
            schedule = {}
            for item in items:
                etype = item['entity_type']
                if etype == 'METADATA':
                    result.update(item)
                    # Maps DynamoDB keys back to expected API response keys
                    result['ev_requests'] = item.get('ev_count')
                elif etype.startswith('EV#'):
                    ev_id = etype.split('#')[1]
                    schedule[ev_id] = item.get('schedule_array', [])
                    
            if schedule:
                result['schedule'] = schedule
                
            return result
        except Exception as e:
            print(f"AWS Storage Read Error: {e}")
            return None
