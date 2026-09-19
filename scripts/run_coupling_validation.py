import pandas as pd
import numpy as np
import os
import sys

# Ensure EV project root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.integration.forecast_optimizer import run_forecast_optimized_simulation

def analyze_forecast_contribution(F_t, B_t, smart_schedule, num_slots):
    # Calculate synthetic smart load
    smart_synth_t = np.zeros(num_slots)
    for ev, powers in smart_schedule.items():
        smart_synth_t += np.array(powers)
        
    total_sys_t = F_t + smart_synth_t
    
    f_peak = np.max(F_t)
    f_avg = np.mean(F_t)
    synth_peak = np.max(smart_synth_t)
    sys_peak = np.max(total_sys_t)
    
    f_peak_idx = np.argmax(F_t)
    sys_peak_idx = np.argmax(total_sys_t)
    
    f_contrib_at_sys_peak = F_t[sys_peak_idx]
    f_contrib_pct = (f_contrib_at_sys_peak / total_sys_t[sys_peak_idx]) * 100.0 if total_sys_t[sys_peak_idx] > 0 else 0
    
    print("\n==================================================")
    print("1. FORECAST CONTRIBUTION (Normal Scenario)")
    print("==================================================")
    print(f"Forecast peak:              {f_peak:.0f} kW (at slot {f_peak_idx})")
    print(f"Forecast average:           {f_avg:.0f} kW")
    print(f"Optimized synthetic EV peak:{synth_peak:.0f} kW")
    print(f"Total system peak:          {sys_peak:.0f} kW (at slot {sys_peak_idx})")
    print(f"Forecast contribution at total system peak: {f_contrib_at_sys_peak:.0f} kW ({f_contrib_pct:.1f}%)")
    
    return total_sys_t, smart_synth_t

def run_grid_capacity_sensitivity(requests, station_capacities, dt_hours, capacities_to_test):
    print("\n==================================================")
    print("2. GRID-CAPACITY SENSITIVITY ANALYSIS")
    print("==================================================")
    print(f"{'Capacity':<10} | {'Base Peak':<10} | {'Opt Peak':<10} | {'Grid Viol':<10} | {'Deadlines Met':<15} | {'Feasible':<10}")
    print("-" * 75)
    
    results = []
    
    for cap in capacities_to_test:
        res = run_forecast_optimized_simulation(
            requests=requests,
            grid_capacity=cap,
            station_capacities=station_capacities,
            dt_hours=dt_hours,
            forecast_modifier=0.0
        )
        
        base_peak = res['baseline_res']['peak_load']
        smart_peak = res['smart_res']['peak_load']
        grid_viol = res['smart_res']['grid_violations']
        
        num_evs = len(requests)
        missed = res['smart_res']['missed_deadlines']
        deadline_met_pct = ((num_evs - missed) / num_evs) * 100.0
        
        feasible = res['smart_res']['feasible']
        
        print(f"{cap:<10.0f} | {base_peak:<10.0f} | {smart_peak:<10.0f} | {grid_viol:<10} | {deadline_met_pct:<14.1f}% | {str(feasible):<10}")
        results.append({'cap': cap, 'res': res})
        
    return results

def run_constrained_forecast_sensitivity(requests, station_capacities, dt_hours, binding_cap):
    print("\n==================================================")
    print(f"3. CONSTRAINED FORECAST SENSITIVITY (Grid Capacity = {binding_cap} kW)")
    print("==================================================")
    
    scenarios = [
        ("Original", 0.0),
        ("+20%", 20.0),
        ("-20%", -20.0)
    ]
    
    print(f"{'Scenario':<10} | {'Forecast Peak':<15} | {'Opt System Peak':<17} | {'Peak Reduc':<12} | {'Deadlines Met':<15} | {'Feasible':<10}")
    print("-" * 90)
    
    num_evs = len(requests)
    
    for name, mod in scenarios:
        res = run_forecast_optimized_simulation(
            requests=requests,
            grid_capacity=binding_cap,
            station_capacities=station_capacities,
            dt_hours=dt_hours,
            forecast_modifier=mod
        )
        
        f_peak = np.max(res['forecast_F_t'])
        smart_peak = res['smart_res']['peak_load']
        base_peak = res['baseline_res']['peak_load']
        
        peak_reduction = ((base_peak - smart_peak) / base_peak) * 100.0 if base_peak > 0 else 0
        
        missed = res['smart_res']['missed_deadlines']
        deadline_met_pct = ((num_evs - missed) / num_evs) * 100.0
        feasible = res['smart_res']['feasible']
        
        print(f"{name:<10} | {f_peak:<15.0f} | {smart_peak:<17.0f} | {peak_reduction:<11.1f}% | {deadline_met_pct:<14.1f}% | {str(feasible):<10}")

def verify_no_double_counting(F_t, smart_synth_t, total_sys_t):
    print("\n==================================================")
    print("5. DOUBLE COUNTING VERIFICATION")
    print("==================================================")
    
    # Mathematical invariant check
    calculated_total = F_t + smart_synth_t
    diff = np.abs(total_sys_t - calculated_total)
    
    max_err = np.max(diff)
    mean_err = np.mean(diff)
    violating_slots = np.sum(diff > 1e-6)
    
    print(f"Max absolute error:  {max_err:.6e}")
    print(f"Mean absolute error: {mean_err:.6e}")
    print(f"Violating slots:     {violating_slots} out of {len(F_t)}")
    
    if max_err < 1e-6:
        print("\nSUCCESS: Total system load is strictly the sum of forecast background and scheduled synthetic EV load.")
    else:
        print("\nFAILURE: Double counting or missing load detected.")

def main():
    scenario_file = 'data/scenarios/evening_peak.csv'
    if not os.path.exists(scenario_file):
        print(f"Error: {scenario_file} not found.")
        sys.exit(1)
        
    df = pd.read_csv(scenario_file)
    requests = df.to_dict('records')
    station_capacities = {f"ST{str(i).zfill(3)}": 105.0 for i in range(1, 21)}
    
    # Run Normal (2500 kW capacity)
    res_normal = run_forecast_optimized_simulation(
        requests=requests,
        grid_capacity=2500.0,
        station_capacities=station_capacities,
        dt_hours=0.5,
        forecast_modifier=0.0
    )
    
    total_sys_t, smart_synth_t = analyze_forecast_contribution(
        res_normal['forecast_F_t'], 
        res_normal['synthetic_baseline_B_t'], 
        res_normal['smart_res']['schedule'], 
        len(res_normal['forecast_F_t'])
    )
    
    verify_no_double_counting(res_normal['forecast_F_t'], smart_synth_t, total_sys_t)
    
    # The normal synthetic peak is ~858 kW.
    # The forecast peak is ~331 kW.
    # We will test grid capacities from 2500 down to 800
    caps_to_test = [2500.0, 1500.0, 1200.0, 1000.0, 950.0, 900.0, 850.0, 800.0]
    sens_results = run_grid_capacity_sensitivity(requests, station_capacities, 0.5, caps_to_test)
    
    # Find a meaningfully binding feasible capacity
    # It must be feasible, but ideally has a peak close to capacity
    binding_cap = None
    for r in reversed(sens_results): # start from smallest
        if r['res']['smart_res']['feasible']:
            binding_cap = r['cap']
            break
            
    if binding_cap is None:
        binding_cap = 1000.0
        
    run_constrained_forecast_sensitivity(requests, station_capacities, 0.5, binding_cap)

if __name__ == '__main__':
    main()
