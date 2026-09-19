import pandas as pd
import numpy as np
import datetime
import uuid
import os

def generate_scenario(scenario_name, n_requests, start_date, seed, params):
    np.random.seed(seed)
    
    # 1. Arrival Times
    if params['arrival_dist'] == 'evening_peak':
        peak_n = int(n_requests * 0.8)
        off_n = n_requests - peak_n
        peak_seconds = np.random.uniform(17*3600, 20*3600, peak_n)
        off_seconds = np.random.uniform(0, 24*3600, off_n)
        all_seconds = np.concatenate([peak_seconds, off_seconds])
    else:
        all_seconds = np.random.uniform(0, 24*3600, n_requests)
    
    arrival_times = [start_date + datetime.timedelta(seconds=s) for s in all_seconds]
    
    # 2. Battery Capacity & Power
    if params['capacity_dist'] == 'high_capacity':
        battery_capacities = np.random.uniform(70, 100, n_requests)
    else:
        battery_capacities = np.random.uniform(30, 100, n_requests)
        
    max_powers = np.random.choice([7, 11, 22, 50], n_requests, p=[0.4, 0.3, 0.2, 0.1])
    
    # 3. SOC
    if params['soc_dist'] == 'low_soc':
        initial_socs = np.random.uniform(5, 20, n_requests)
    else:
        initial_socs = np.random.uniform(10, 60, n_requests)
        
    target_socs = np.random.uniform(80, 100, n_requests)
    
    # Generate records
    station_ids = [f"ST{str(i).zfill(3)}" for i in range(1, 21)]
    # Use uniform distribution derived from the historical dataset (all stations hovered around ~5% probability)
    station_probs = [1.0/len(station_ids)] * len(station_ids)
    
    records = []
    
    for i in range(n_requests):
        arrival = arrival_times[i]
        cap = battery_capacities[i]
        init_soc = initial_socs[i]
        targ_soc = target_socs[i]
        power = max_powers[i]
        
        energy_req = cap * (targ_soc - init_soc) / 100.0
        min_charge_time_h = energy_req / power
        
        min_buf, max_buf = params['flexibility_buffer_hours']
        buffer_h = np.random.uniform(min_buf, max_buf)
        
        departure = arrival + datetime.timedelta(hours=(min_charge_time_h + buffer_h))
        
        records.append({
            'ev_id': f"EV_{uuid.uuid4().hex[:8]}",
            'station_id': np.random.choice(station_ids, p=station_probs),
            'arrival_time': arrival.strftime('%Y-%m-%d %H:%M:%S'),
            'departure_deadline': departure.strftime('%Y-%m-%d %H:%M:%S'),
            'battery_capacity_kWh': round(cap, 2),
            'initial_soc': round(init_soc, 2),
            'target_soc': round(targ_soc, 2),
            'max_charging_power_kW': power,
            'energy_required_kWh': round(energy_req, 2),
            'minimum_charging_time_h': round(min_charge_time_h, 2),
            'flexibility_buffer_h': round(buffer_h, 2),
            'scenario': scenario_name
        })
        
    df = pd.DataFrame(records)
    df = df.sort_values('arrival_time')
    return df

def main():
    os.makedirs('data/scenarios', exist_ok=True)
    start_date = datetime.datetime(2025, 4, 1, 0, 0, 0)
    base_n = 500
    
    scenarios = {
        'NORMAL_EVENING': {
            'arrival_dist': 'evening_peak',
            'capacity_dist': 'normal',
            'soc_dist': 'normal',
            'flexibility_buffer_hours': (8.0, 12.0)
        },
        'HIGH_STRESS': {
            'arrival_dist': 'evening_peak',
            'capacity_dist': 'high_capacity',
            'soc_dist': 'low_soc',
            'flexibility_buffer_hours': (1.0, 4.0)
        },
        'TIGHT_DEADLINE': {
            'arrival_dist': 'evening_peak',
            'capacity_dist': 'normal',
            'soc_dist': 'normal',
            'flexibility_buffer_hours': (0.0, 0.5)
        },
        'INFEASIBLE': {
            'arrival_dist': 'evening_peak',
            'capacity_dist': 'high_capacity',
            'soc_dist': 'low_soc',
            # Negative buffer makes it physically impossible
            'flexibility_buffer_hours': (-1.0, -0.1) 
        }
    }
    
    for i, (s_name, s_params) in enumerate(scenarios.items()):
        print(f"Generating {s_name} scenario...")
        df = generate_scenario(s_name, base_n, start_date, seed=100+i, params=s_params)
        df.to_csv(f'data/scenarios/{s_name}.csv', index=False)
        
    print("Successfully generated calibrated scenarios.")

if __name__ == '__main__':
    main()
