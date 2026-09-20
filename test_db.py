import sys
import os

# Add current directory to path so we can import api.database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.database import Database

def test_connection():
    print("Testing connection to AWS DynamoDB in ap-south-1...")
    try:
        # Test 1: Write an Alert
        print("\n1. Writing test alert to SmartCharge_Alerts table...")
        alert_id = Database.save_alert({
            "type": "TEST_CONNECTION",
            "message": "Hello from the Python backend! The AWS keys are working.",
            "severity": "INFO"
        })
        print(f"Success! Created alert with ID: {alert_id}")

        # Test 2: Read Alerts
        print("\n2. Reading active alerts...")
        alerts = Database.get_alerts()
        print(f"Success! Found {len(alerts)} active alerts.")
        for a in alerts:
            print(f"  - {a.get('type')}: {a.get('message')}")

    except Exception as e:
        print(f"\nERROR connecting to DynamoDB: {e}")
        print("Please check if the AWS keys are correct and if the tables exist.")

if __name__ == "__main__":
    test_connection()
