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
    
    # Generate a synthetic realistic urban demand curve
    hourly_grid_load = np.zeros(num_hours)
    for h in range(num_hours):
        hour_of_day = h % 24
        
        # Base load (always on)
        base = 400
        
        # Morning peak (around 8am) - Moderate level
        morning = 800 * np.exp(-((hour_of_day - 8)**2) / (2 * 2**2))
        
        # Evening peak (around 7pm / 19:00) - High stress level (3/4 capacity)
        evening = 1500 * np.exp(-((hour_of_day - 19)**2) / (2 * 2.5**2))
        
        # Small afternoon plateau
        afternoon = 300 * np.exp(-((hour_of_day - 13)**2) / (2 * 4**2))
        
        hourly_grid_load[h] = base + morning + evening + afternoon
        
    # Apply modifier (if any)
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
