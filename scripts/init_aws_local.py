import boto3
import os

AWS_ENDPOINT = "http://localhost:5000"
DYNAMODB_TABLE = "SmartChargeSimulations"
S3_BUCKET = "smartcharge-artifacts"

def init_aws():
    print("Connecting to Moto Server at", AWS_ENDPOINT)
    
    # 1. DynamoDB
    dynamodb = boto3.client(
        'dynamodb',
        endpoint_url=AWS_ENDPOINT,
        region_name='us-east-1',
        aws_access_key_id='testing',
        aws_secret_access_key='testing'
    )
    
    try:
        dynamodb.create_table(
            TableName=DYNAMODB_TABLE,
            KeySchema=[
                {'AttributeName': 'simulation_id', 'KeyType': 'HASH'},
                {'AttributeName': 'entity_type', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'simulation_id', 'AttributeType': 'S'},
                {'AttributeName': 'entity_type', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"Created DynamoDB table: {DYNAMODB_TABLE}")
    except dynamodb.exceptions.ResourceInUseException:
        print(f"DynamoDB table {DYNAMODB_TABLE} already exists")
        
    # 2. S3
    s3 = boto3.client(
        's3',
        endpoint_url=AWS_ENDPOINT,
        region_name='us-east-1',
        aws_access_key_id='testing',
        aws_secret_access_key='testing'
    )
    
    try:
        s3.create_bucket(Bucket=S3_BUCKET)
        print(f"Created S3 bucket: {S3_BUCKET}")
    except s3.exceptions.BucketAlreadyExists:
        print(f"S3 bucket {S3_BUCKET} already exists")
    except s3.exceptions.BucketAlreadyOwnedByYou:
        print(f"S3 bucket {S3_BUCKET} already owned by you")

if __name__ == '__main__':
    init_aws()
