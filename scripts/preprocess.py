import pandas as pd
import numpy as np
import os
import argparse

def create_time_features(df):
    """Generate various time-based features from the timestamp."""
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['day_of_month'] = df['timestamp'].dt.day
    df['month'] = df['timestamp'].dt.month
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    # Define peak hours generally as 17-21 (5 PM to 9 PM)
    df['is_peak_hour'] = df['hour'].isin([17, 18, 19, 20, 21]).astype(int)
    return df

def preprocess(input_path, output_path):
    print(f"Loading data from {input_path}...")
    df = pd.read_csv(input_path)
    
    print("Removing exact duplicates...")
    df.drop_duplicates(inplace=True)
    
    print("Parsing date/time columns...")
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Remove or flag impossible values
    # Ensure charging_demand is not negative
    original_len = len(df)
    df = df[df['charging_demand'] >= 0]
    if len(df) < original_len:
        print(f"Removed {original_len - len(df)} rows with negative charging_demand.")
    
    # Drop leakage columns: Information only known after session begins/ends
    # These pose a direct leakage risk for forecasting demand.
    leakage_cols = [
        'charging_start_time', 'charging_end_time', 'waiting_time', 
        'final_soc', 'energy_consumed_kWh', 'charging_duration', 
        'optimization_reward', 'arrival_time', 'assigned_charger_id',
        'initial_soc', 'battery_capacity_kWh', 'vehicle_id', 'vehicle_type', 'charging_priority'
    ]
    # Note: initial_soc, vehicle_id, etc. are per-session features. When aggregating to hourly forecasting
    # we cannot know WHICH vehicles will arrive in the future hour, so we must drop them.
    df.drop(columns=[c for c in leakage_cols if c in df.columns], inplace=True)
    
    print("Aggregating demand at station level (Hourly)...")
    stations = df['station_id'].unique()
    
    # Get static station info
    station_info = df.groupby('station_id')[['location_type']].first().reset_index()
    
    df.set_index('timestamp', inplace=True)
    
    aggregated_dfs = []
    
    for station in stations:
        station_data = df[df['station_id'] == station]
        
        # Resample to 1 Hour intervals
        resampled = pd.DataFrame()
        # Mean for target (since it represents power in kW)
        resampled['charging_demand'] = station_data['charging_demand'].resample('1h').mean()
        
        # Mean for state variables over the hour
        resampled['station_load'] = station_data['station_load'].resample('1h').mean()
        resampled['queue_length'] = station_data['queue_length'].resample('1h').mean()
        resampled['electricity_price'] = station_data['electricity_price'].resample('1h').mean()
        resampled['renewable_energy_ratio'] = station_data['renewable_energy_ratio'].resample('1h').mean()
        
        # Mode for categorical environment variables
        resampled['weather_condition'] = station_data['weather_condition'].resample('1h').agg(lambda x: x.mode()[0] if not x.empty else np.nan)
        resampled['traffic_density'] = station_data['traffic_density'].resample('1h').agg(lambda x: x.mode()[0] if not x.empty else np.nan)
        
        # Handle missing values due to resampling
        # 0 demand/load/queue if no sessions occurred
        resampled['charging_demand'] = resampled['charging_demand'].fillna(0)
        resampled['station_load'] = resampled['station_load'].fillna(0)
        resampled['queue_length'] = resampled['queue_length'].fillna(0)
        
        # Environmental variables persist, so use forward-fill then backward-fill
        resampled['electricity_price'] = resampled['electricity_price'].ffill().bfill()
        resampled['renewable_energy_ratio'] = resampled['renewable_energy_ratio'].ffill().bfill()
        resampled['weather_condition'] = resampled['weather_condition'].ffill().bfill()
        resampled['traffic_density'] = resampled['traffic_density'].ffill().bfill()
        
        resampled['station_id'] = station
        aggregated_dfs.append(resampled.reset_index())
        
    final_df = pd.concat(aggregated_dfs, ignore_index=True)
    
    # Merge static info back
    final_df = final_df.merge(station_info, on='station_id', how='left')
    
    print("Creating time features...")
    final_df = create_time_features(final_df)
    
    print("Converting categorical variables...")
    # One-hot encode categoricals
    cat_cols = ['location_type', 'weather_condition', 'traffic_density']
    final_df = pd.get_dummies(final_df, columns=cat_cols, drop_first=False)
    
    # Sort logically
    final_df.sort_values(['station_id', 'timestamp'], inplace=True)
    
    print(f"Saving processed dataset to {output_path}...")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_df.to_csv(output_path, index=False)
    print("Preprocessing complete!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess EV charging data for forecasting")
    parser.add_argument('--input', type=str, default='data/ev_charging_demand.csv', help='Path to raw CSV')
    parser.add_argument('--output', type=str, default='data/processed/forecasting_data.csv', help='Path to save processed CSV')
    args = parser.parse_args()
    
    preprocess(args.input, args.output)
