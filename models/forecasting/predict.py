import pandas as pd
import joblib

# Load artifacts globally so they don't load on every function call
try:
    _MODEL = joblib.load('models/forecasting/rf_model.pkl')
    _FEATURES = joblib.load('models/forecasting/features.pkl')
except Exception as e:
    _MODEL = None
    _FEATURES = None

def predict_demand(input_data):
    """
    Predicts EV charging demand for a given sequence of data.
    
    Args:
        input_data (pd.DataFrame): The input dataframe containing the required predictors.
                                   Must contain station_id, timestamp, charging_demand, 
                                   station_load, and queue_length from the *previous* hour
                                   if passing un-lagged data, OR must already contain the 
                                   lag_1 features.
    
    Returns:
        np.array: Array of forecasted demand values.
    """
    if _MODEL is None or _FEATURES is None:
        raise RuntimeError("Model or features not found. Please train the model first.")
        
    df = input_data.copy()
    
    # Check if we need to generate lag features dynamically
    if 'lag_1_demand' not in df.columns:
        # We need historical data in the dataframe to generate lag
        df = df.sort_values(['station_id', 'timestamp'])
        df['lag_1_demand'] = df.groupby('station_id')['charging_demand'].shift(1)
        df['lag_1_load'] = df.groupby('station_id')['station_load'].shift(1)
        df['lag_1_queue'] = df.groupby('station_id')['queue_length'].shift(1)
        
        # New lagged features added in train.py to avoid concurrent leakage
        df['lag_1_electricity_price'] = df.groupby('station_id')['electricity_price'].shift(1)
        df['lag_1_renewable_energy_ratio'] = df.groupby('station_id')['renewable_energy_ratio'].shift(1)
        
        if 'weather_condition_Clear' in df.columns:
            df['lag_1_weather_condition_Clear'] = df.groupby('station_id')['weather_condition_Clear'].shift(1)
            df['lag_1_weather_condition_Cloudy'] = df.groupby('station_id')['weather_condition_Cloudy'].shift(1)
            df['lag_1_weather_condition_Rainy'] = df.groupby('station_id')['weather_condition_Rainy'].shift(1)
            
        if 'traffic_density_High' in df.columns:
            df['lag_1_traffic_density_High'] = df.groupby('station_id')['traffic_density_High'].shift(1)
            df['lag_1_traffic_density_Low'] = df.groupby('station_id')['traffic_density_Low'].shift(1)
            df['lag_1_traffic_density_Medium'] = df.groupby('station_id')['traffic_density_Medium'].shift(1)
            
        # Drop the first row per station which is now NaN
        df = df.dropna(subset=['lag_1_demand'])
    
    X = df[_FEATURES]
    forecast = _MODEL.predict(X)
    
    return forecast
