import pandas as pd

def analyze():
    df = pd.read_csv('ev_charging_dataset.csv')
    print("Number of rows:", len(df))
    print("Number of columns:", len(df.columns))
    print("\nData Types:")
    print(df.dtypes.to_string())
    print("\nMissing Values:")
    print(df.isnull().sum().to_string())
    print("\nDuplicate Rows:", df.duplicated().sum())
    
    print("\nTimestamp Range:")
    print("Min:", df['timestamp'].min())
    print("Max:", df['timestamp'].max())
    
    print("\nNumber of stations:", df['station_id'].nunique())
    print("Number of vehicles:", df['vehicle_id'].nunique())
    
    print("\nCategorical values:")
    for col in df.select_dtypes(include=['object']).columns:
        if col not in ['timestamp', 'arrival_time', 'charging_start_time', 'charging_end_time', 'vehicle_id', 'station_id', 'assigned_charger_id']:
            print(f"{col}: {df[col].unique()}")
    
    print("\nDescribe numeric columns:")
    print(df.describe().to_string())

if __name__ == "__main__":
    analyze()
