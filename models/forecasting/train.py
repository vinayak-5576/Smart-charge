import pandas as pd
import numpy as np
import os
import joblib
from sklearn.ensemble import RandomForestRegressor

def generate_lag_features(df):
    """Generate lag features grouped by station_id."""
    # Ensure sorted by station and time
    df = df.sort_values(['station_id', 'timestamp'])
    
    # Create lag features
    df['lag_1_demand'] = df.groupby('station_id')['charging_demand'].shift(1)
    df['lag_1_load'] = df.groupby('station_id')['station_load'].shift(1)
    df['lag_1_queue'] = df.groupby('station_id')['queue_length'].shift(1)
    
    # Lag potential leakage variables (price, renewable_ratio, and one-hot encoded weather/traffic)
    leakage_bases = ['electricity_price', 'renewable_energy_ratio']
    # Find all weather and traffic columns
    leakage_bases += [c for c in df.columns if c.startswith('weather_condition_') or c.startswith('traffic_density_')]
    
    for c in leakage_bases:
        df[f'lag_1_{c}'] = df.groupby('station_id')[c].shift(1)
    
    return df

def get_train_test_split(df, test_size=0.2):
    """Time-aware train/test split."""
    # Ensure chronological order
    df = df.sort_values('timestamp')
    
    n_samples = len(df)
    split_idx = int(n_samples * (1 - test_size))
    
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]
    
    return train_df, test_df

def main():
    print("Loading preprocessed data...")
    data_path = 'data/processed/forecasting_data.csv'
    df = pd.read_csv(data_path)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    print("Generating lag features...")
    df = generate_lag_features(df)
    
    # Drop rows with NaN (the first hour for each station due to shifting)
    df = df.dropna()
    
    print("Performing time-aware split...")
    train_df, test_df = get_train_test_split(df, test_size=0.2)
    
    # Define features to use (drop target and leaky concurrent states)
    # Exclude timestamp, station_id, and concurrent states
    leaky_concurrents = [
        'timestamp', 'station_id', 'charging_demand', 'station_load', 'queue_length',
        'electricity_price', 'renewable_energy_ratio'
    ]
    leaky_concurrents += [c for c in df.columns if c.startswith('weather_condition_') or c.startswith('traffic_density_')]
    
    features = [c for c in df.columns if c not in leaky_concurrents]
    
    X_train = train_df[features]
    y_train = train_df['charging_demand']
    
    print(f"Training RandomForestRegressor on {len(X_train)} samples with {len(features)} features...")
    model = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    print("Saving model artifacts...")
    os.makedirs('models/forecasting', exist_ok=True)
    
    # Save the model
    joblib.dump(model, 'models/forecasting/rf_model.pkl')
    
    # Save the feature list for prediction mapping
    joblib.dump(features, 'models/forecasting/features.pkl')
    
    # Save test dataset for evaluate script
    test_df.to_csv('models/forecasting/test_data.csv', index=False)
    print("Training complete!")

if __name__ == '__main__':
    main()
