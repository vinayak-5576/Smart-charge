import uuid
import pandas as pd
import numpy as np
import os
import sys

# Ensure project root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.integration.forecast_optimizer import run_forecast_optimized_simulation as core_sim
from tests.test_optimizer import create_mock_requests

def run_forecast_optimized_simulation(config):
    """
    Service layer wrapper to execute a complete SmartCharge simulation.
    
    Args:
        config (dict): Configuration dictionary containing:
            - simulation_id (str, optional)
            - scenario_type (str): 'mock' or 'csv'
            - scenario_file (str, optional): path if csv
            - num_evs (int, optional): if mock
            - flexibility_buffer_hours (float, optional): if mock
            - grid_capacity (float): grid constraint in kW
            - num_stations (int): number of stations
            - station_capacity (float): limit per station in kW
            - dt_hours (float, optional): resolution (default 0.5)
            - forecast_modifier (float, optional): e.g., 0.0
            
    Returns:
        dict: Serializable result dictionary.
    """
    sim_id = config.get('simulation_id', str(uuid.uuid4()))
    dt_hours = config.get('dt_hours', 0.5)
    forecast_modifier = config.get('forecast_modifier', 0.0)
    grid_capacity = config.get('grid_capacity', 2500.0)
    
    num_stations = config.get('num_stations', 20)
    station_capacity = config.get('station_capacity', 105.0)
    station_capacities = {f"ST{str(i).zfill(3)}": station_capacity for i in range(1, num_stations + 1)}
    
    # 1. & 3. Load or generate EV requests
    scenario_type = config.get('scenario_type', 'mock')
    ev_growth_percent = config.get('ev_growth_percent', 0.0)
    
    if scenario_type == 'csv':
        filepath = config.get('scenario_file')
        if not filepath or not os.path.exists(filepath):
            return {"error": f"Scenario file not found: {filepath}", "feasible": False}
        df = pd.read_csv(filepath)
        requests = df.to_dict('records')
        scenario_name = os.path.basename(filepath)
    else:
        num_evs = config.get('num_evs', 50)
        # Apply What-If EV Growth
        if ev_growth_percent > 0:
            num_evs = int(num_evs * (1.0 + (ev_growth_percent / 100.0)))
            
        flex_buffer = config.get('flexibility_buffer_hours', 4.0)
        requests = create_mock_requests(num_evs, flexibility_buffer_hours=flex_buffer)
        scenario_name = f"Mock_{num_evs}EVs"
        
    # Energy requirement
    energy_required = sum(r['energy_required_kWh'] for r in requests)
        
    # Apply What-If Solar Capacity
    solar_modifier = config.get('solar_capacity_modifier', 0.0)
    if solar_modifier > 0:
        grid_capacity += (grid_capacity * (solar_modifier / 100.0))
    # 2, 4, 5. Run core simulation (which internally handles forecast, baseline, and optimization)
    try:
        results = core_sim(
            requests=requests,
            grid_capacity=grid_capacity,
            station_capacities=station_capacities,
            dt_hours=dt_hours,
            forecast_modifier=forecast_modifier,
            # Pass None to trigger engine's default generation, but could build array here
            cost_profile=None, 
            renewable_profile=None
        )
    except Exception as e:
        return {
            "simulation_id": sim_id,
            "scenario": scenario_name,
            "feasible": False,
            "failure_reason": str(e)
        }
        
    # 6. Calculate all metrics
    base_res = results['baseline_res']
    smart_res = results['smart_res']
    F_t = results['forecast_F_t']
    B_t = results['synthetic_baseline_B_t']
    
    base_peak = base_res['peak_load']
    smart_peak = smart_res['peak_load']
    
    # We must explicitly convert numpy float types to native Python floats for JSON serialization
    def serialize_float(val):
        return float(val) if not pd.isna(val) else 0.0

    peak_reduction = 0.0
    if base_peak > 0:
        peak_reduction = (base_peak - smart_peak) / base_peak * 100.0
        
    num_reqs = len(requests)
    deadline_comp = 100.0
    if num_reqs > 0:
        deadline_comp = ((num_reqs - smart_res['missed_deadlines']) / num_reqs) * 100.0
        
    smart_total_load = np.zeros(len(F_t)) if len(F_t) > 0 else np.zeros(1)
    if smart_res['schedule']:
        first_sched = next(iter(smart_res['schedule'].values()))
        smart_total_load = np.zeros(len(first_sched))
        for ev_id, schedule in smart_res['schedule'].items():
            smart_total_load += np.array(schedule)

    # 7. Return serializable dictionary
    return {
        "simulation_id": sim_id,
        "scenario": scenario_name,
        "forecast": {
            "peak_kW": serialize_float(np.max(F_t)),
            "average_kW": serialize_float(np.mean(F_t)),
            "time_series": [serialize_float(x) for x in F_t]
        },
        "grid_capacity": serialize_float(grid_capacity),
        "ev_requests": num_reqs,
        "baseline_peak": serialize_float(base_peak),
        "optimized_peak": serialize_float(smart_peak),
        "baseline_time_series": [serialize_float(x) for x in B_t],
        "optimized_time_series": [serialize_float(x) for x in smart_total_load],
        "peak_reduction": serialize_float(peak_reduction),
        "deadline_compliance": serialize_float(deadline_comp),
        "grid_compliance": smart_res['grid_violations'] == 0,
        "energy_required": serialize_float(energy_required),
        "energy_delivered": serialize_float(smart_res['total_energy']),
        "constraint_violations": int(smart_res['violations']),
        "feasible": bool(smart_res['feasible']),
        "failure_reason": str(smart_res.get('reason', '')),
        "schedule": {
            k: [serialize_float(x) for x in v] for k, v in smart_res['schedule'].items()
        },
        "ev_requests_data": requests
    }
