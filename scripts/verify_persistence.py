import boto3
import json

AWS_ENDPOINT = "http://localhost:5000"
DYNAMODB_TABLE = "SmartChargeSimulations"
S3_BUCKET = "smartcharge-artifacts"

def verify_persistence(simulation_id):
    print("========================================")
    print(f"Verifying AWS Persistence for {simulation_id}")
    print("========================================")
    
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url=AWS_ENDPOINT,
        region_name='us-east-1',
        aws_access_key_id='testing',
        aws_secret_access_key='testing'
    )
    
    s3 = boto3.client(
        's3',
        endpoint_url=AWS_ENDPOINT,
        region_name='us-east-1',
        aws_access_key_id='testing',
        aws_secret_access_key='testing'
    )
    
    table = dynamodb.Table(DYNAMODB_TABLE)
    
    # 1. Check DynamoDB items
    print("Querying DynamoDB...")
    from boto3.dynamodb.conditions import Key
    response = table.query(
        KeyConditionExpression=Key('simulation_id').eq(simulation_id)
    )
    items = response.get('Items', [])
    
    metadata = None
    ev_count = 0
    
    for item in items:
        if item['entity_type'] == 'METADATA':
            metadata = item
        elif item['entity_type'].startswith('EV#'):
            ev_count += 1
            
    assert metadata is not None, "Metadata entity not found in DynamoDB!"
    print(f"Found METADATA entity: Optimized Peak = {metadata['optimized_peak']} kW")
    print(f"Found {ev_count} EV Schedule entities perfectly partitioned!")
    
    # Verify the values
    assert float(metadata['optimized_peak']) > 0
    assert ev_count == int(metadata['ev_count'])
    
    # 2. Check S3 payload
    print("\nQuerying S3...")
    obj = s3.get_object(Bucket=S3_BUCKET, Key=f"simulations/{simulation_id}/full_payload.json")
    payload = json.loads(obj['Body'].read().decode('utf-8'))
    
    assert payload['simulation_id'] == simulation_id
    print("Found complete artifact JSON blob in S3!")
    
    print("\n✅ AWS Persistence verified successfully!")

if __name__ == '__main__':
    verify_persistence('api-test-001')
