import json
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from services.smartcharge_service import run_forecast_optimized_simulation

def main():
    config = {
        'simulation_id': 'demo-cloud-sim-001',
        'scenario_type': 'mock',
        'num_evs': 20,
        'flexibility_buffer_hours': 4.0,
        'grid_capacity': 2500.0,
        'num_stations': 5,
        'station_capacity': 105.0,
        'dt_hours': 0.5,
        'forecast_modifier': 0.0
    }
    
    result = run_forecast_optimized_simulation(config)
    
    # We will exclude the schedule and time_series from printing just so it's readable in the terminal
    if 'schedule' in result:
        del result['schedule']
    if 'forecast' in result and 'time_series' in result['forecast']:
        del result['forecast']['time_series']
        
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
