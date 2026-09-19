import pandas as pd
import numpy as np
import sys
import os
from models.integration.forecast_optimizer import run_forecast_optimized_simulation

def print_demo_report(title, scenario_name, results, requests, grid_capacity, station_capacities):
    num_evs = len(requests)
    base_res = results['baseline_res']
    smart_res = results['smart_res']
    
    total_energy_req = sum(r['energy_required_kWh'] for r in requests)
    
    base_peak = base_res['peak_load']
    smart_peak = smart_res['peak_load']
    
    # We must calculate peak total load correctly
    reduction = 0.0 if base_peak == 0 else (base_peak - smart_peak) / base_peak * 100.0
    
    forecast_F_t = results['forecast_F_t']
    
    print(f"\n========================================")
    print(f"SMARTCHARGE - FINAL INTEGRATED DEMO")
    print(f"========================================")
    print(f"Forecast horizon:       {len(forecast_F_t) * 0.5:.1f} hours")
    print(f"EVs:                    {num_evs}")
    print(f"Stations:               {len(station_capacities)}")
    print(f"Grid capacity:          {grid_capacity:.0f} kW")
    
    print(f"\nFORECAST")
    print(f"Peak predicted demand:  {np.max(forecast_F_t):.0f} kW")
    print(f"Average predicted demand:{np.mean(forecast_F_t):.0f} kW")
    
    print(f"\nBASELINE EV LOAD (Synthetic)")
    print(f"Peak:                   {base_peak:.0f} kW")
    print(f"System violations:      {base_res['grid_violations']}")
    
    print(f"\nSMARTCHARGE EV LOAD (Synthetic)")
    print(f"Peak:                   {smart_peak:.0f} kW")
    print(f"System violations:      {smart_res['grid_violations']}")
    
    print(f"\nPeak reduction:         {reduction:.1f} %")
    
    print(f"\nEV deadline compliance: {(num_evs - smart_res['missed_deadlines']) / num_evs * 100:.1f} %")
    print(f"Energy delivered:       {smart_res['total_energy'] / total_energy_req * 100:.1f} %")
    print(f"Constraint violations:  {smart_res['violations']}")
    print(f"Feasible:               {'YES' if smart_res['feasible'] else 'NO'}")
    if not smart_res['feasible']:
        print(f"Reason:                 {smart_res.get('reason', '')}")
        
    print(f"\nBACKGROUND LOAD (Legacy EVs)")
    print(f"Peak:                   {np.max(forecast_F_t):.0f} kW")
    
    print(f"\nTOTAL SYSTEM EV LOAD (Legacy + Synthetic)")
    print(f"Baseline peak:          {np.max(results['synthetic_baseline_B_t'] + forecast_F_t):.0f} kW")
    print(f"Optimized peak:         {smart_peak:.0f} kW")
    print(f"========================================\n")

def main():
    scenario_file = 'data/scenarios/evening_peak.csv'
    
    # Check if scenario exists
    if not os.path.exists(scenario_file):
        # We need a fallback if we haven't generated evening_peak
        scenario_file = 'data/scenarios/NORMAL_EVENING.csv'
        if not os.path.exists(scenario_file):
            print("Please run scripts/simulator.py first.")
            sys.exit(1)
            
    df = pd.read_csv(scenario_file)
    requests = df.to_dict('records')
    
    grid_capacity = 2500.0
    # Use empirically derived station capacities (105 kW per station)
    station_capacities = {f"ST{str(i).zfill(3)}": 105.0 for i in range(1, 21)}
    
    print("Running Phase 1: End-to-End Test (Normal Forecast)...")
    res_normal = run_forecast_optimized_simulation(
        requests=requests,
        grid_capacity=grid_capacity,
        station_capacities=station_capacities,
        dt_hours=0.5,
        forecast_modifier=0.0
    )
    print_demo_report("FORECAST -> OPTIMIZER DEMO (NORMAL)", "NORMAL_EVENING", res_normal, requests, grid_capacity, station_capacities)
    
    print("Running Phase 2: Sensitivity Test (+20% Forecast Surge)...")
    res_surge = run_forecast_optimized_simulation(
        requests=requests,
        grid_capacity=grid_capacity,
        station_capacities=station_capacities,
        dt_hours=0.5,
        forecast_modifier=20.0
    )
    print_demo_report("FORECAST -> OPTIMIZER DEMO (+20% SURGE)", "NORMAL_EVENING", res_surge, requests, grid_capacity, station_capacities)
    
    print("Running Phase 3: Sensitivity Test (-20% Forecast Drop)...")
    res_drop = run_forecast_optimized_simulation(
        requests=requests,
        grid_capacity=grid_capacity,
        station_capacities=station_capacities,
        dt_hours=0.5,
        forecast_modifier=-20.0
    )
    print_demo_report("FORECAST -> OPTIMIZER DEMO (-20% DROP)", "NORMAL_EVENING", res_drop, requests, grid_capacity, station_capacities)
    
    # Verification assertions
    assert res_normal['smart_res']['feasible'] is True, "Normal scenario should be feasible."
    
    # The surge should increase background load, so peak total load should be higher
    peak_normal = res_normal['smart_res']['peak_load']
    peak_surge = res_surge['smart_res']['peak_load']
    peak_drop = res_drop['smart_res']['peak_load']
    
    print(f"SENSITIVITY VERIFICATION:")
    print(f"Normal Peak: {peak_normal:.0f} kW")
    print(f"Surge Peak:  {peak_surge:.0f} kW")
    print(f"Drop Peak:   {peak_drop:.0f} kW")
    if peak_surge > peak_normal:
        print("Success: Optimizer mathematically reacted to the increased background load by finding a new equilibrium.")
    else:
        print("Warning: Surge did not increase peak. This could happen if the surge was absorbed entirely by flexibility, but usually it raises the floor.")

if __name__ == '__main__':
    main()
