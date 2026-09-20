import pandas as pd
import numpy as np
import os
from models.forecasting.predict import predict_demand
from models.optimization.engine import run_baseline_schedule, run_smart_schedule, discretize_time

def generate_aligned_forecast(num_slots, dt_hours=0.5, modifier_percent=0.0):
    """
    Generates a deterministic forecast based on historical data, and aligns it
    to the optimizer's time resolution.
    
    Args:
        num_slots (int): Number of time slots needed by the optimizer.
        dt_hours (float): Hours per slot (e.g., 0.5 for 30 mins).
        modifier_percent (float): Artificial modification (e.g., 20.0 for +20% surge).
        
    Returns:
        np.array: 1D array of total forecasted grid load (kW) per slot.
    """
    # 1. We need `num_hours` of forecasts. 
    # If we have 28 slots of 30 mins, we need 14 hours of forecast.
    num_hours = int(np.ceil(num_slots * dt_hours))
    
    # Load historical processed data
    data_path = 'data/processed/forecasting_data.csv'
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Missing {data_path}")
        
    df = pd.read_csv(data_path)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Let's pick a known evening peak in the test set to be our deterministic forecast base
    # We will grab a block of data starting around 16:00
    df_sorted = df.sort_values('timestamp')
    unique_times = df_sorted['timestamp'].unique()
    
    # Find a 16:00 timestamp near the end (test set)
    start_time = None
    for t in reversed(unique_times):
        dt = pd.to_datetime(t)
        if dt.hour == 16:
            start_time = t
            break
            
    if start_time is None:
        start_time = unique_times[0]
        
    # Get the next `num_hours` timestamps
    start_idx = np.where(unique_times == start_time)[0][0]
    end_idx = min(start_idx + num_hours, len(unique_times))
    selected_times = unique_times[start_idx:end_idx]
    
    # If we run out of historical data, just pad by repeating the last available hour
    pad_needed = num_hours - len(selected_times)
    
    # Predict on entire dataset to ensure lag features are computed correctly
    try:
        # We need to copy to avoid SettingWithCopyWarning
        df_pred = df.copy()
        forecast_values = predict_demand(df_pred)
        # predict_demand drops the first hour (NaN lag), so we must align indices
        # We know predict_demand sorts by station_id and timestamp, so we should do the same
        df_pred = df_pred.sort_values(['station_id', 'timestamp'])
        df_pred['lag_1_demand'] = df_pred.groupby('station_id')['charging_demand'].shift(1)
        df_pred = df_pred.dropna(subset=['lag_1_demand']).copy()
        
        df_pred['predicted_demand'] = forecast_values
    except Exception as e:
        raise RuntimeError(f"Forecasting failed: {str(e)}")
    
    # Filter to selected times
    df_subset = df_pred[df_pred['timestamp'].isin(selected_times)].copy()
    
    # Aggregate across all stations for each hour to get total grid load
    hourly_grid_load = df_subset.groupby('timestamp')['predicted_demand'].sum().values
    
    if pad_needed > 0:
        last_val = hourly_grid_load[-1] if len(hourly_grid_load) > 0 else 0
        hourly_grid_load = np.append(hourly_grid_load, [last_val] * pad_needed)
        
    # Apply modifier
    hourly_grid_load = hourly_grid_load * (1.0 + (modifier_percent / 100.0))
    
    # 2. Time Alignment (Hourly -> 30 min)
    # Using step interpolation (forward fill)
    repeats = int(1.0 / dt_hours) # e.g. 1.0 / 0.5 = 2
    aligned_forecast = np.repeat(hourly_grid_load, repeats)
    
    # Trim exactly to num_slots
    aligned_forecast = aligned_forecast[:num_slots]
    
    return aligned_forecast

def run_forecast_optimized_simulation(requests, grid_capacity, station_capacities, dt_hours=0.5, forecast_modifier=0.0, **kwargs):
    """
    Runs the full integrated pipeline: Forecast -> Semantics -> Optimizer.
    """
    # 1. Determine time slots required for the requests
    slots, _ = discretize_time(requests, dt_hours)
    num_slots = len(slots)
    
    # 2. Generate Forecast F(t)
    # (Extracts historical slice matching the length of the simulation)
    F_t = generate_aligned_forecast(num_slots, dt_hours, forecast_modifier)
    
    # 3. Calculate Synthetic Baseline Load B(t)
    # We run the baseline schedule with 0 background load first just to get B(t).
    # We use infinite grid_capacity here just to cleanly extract the unconstrained ASAP load of the synthetic EVs.
    temp_base_res = run_baseline_schedule(requests, 999999.0, station_capacities, dt_hours=dt_hours)
    
    B_t = np.zeros(num_slots)
    for ev, powers in temp_base_res['schedule'].items():
        B_t += np.array(powers)
        
    # 4. Calculate Legacy Background Load U(t)
    # The forecast (Legacy Inflexible EVs) and the synthetic requests (New Smart EVs)
    # are two independent populations.
    # Therefore, background load is simply the forecast.
    U_t = F_t.copy()
    
    # 5. Run Baseline and SmartCharge WITH the rigid background load
    baseline_res = run_baseline_schedule(requests, grid_capacity, station_capacities, background_load=U_t, dt_hours=dt_hours)
    smart_res = run_smart_schedule(
        requests, grid_capacity, station_capacities, background_load=U_t, dt_hours=dt_hours,
        cost_profile=kwargs.get('cost_profile'), renewable_profile=kwargs.get('renewable_profile')
    )
    
    return {
        'forecast_F_t': F_t,
        'synthetic_baseline_B_t': B_t,
        'background_load_U_t': U_t,
        'baseline_res': baseline_res,
        'smart_res': smart_res,
        'slots': slots
    }
