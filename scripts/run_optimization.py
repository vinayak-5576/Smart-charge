import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os
from models.optimization.engine import run_baseline_schedule, run_smart_schedule, discretize_time

def main():
    scenario_file = 'data/scenarios/evening_peak.csv'
    print(f"Loading scenario: {scenario_file}")
    
    df = pd.read_csv(scenario_file)
    requests = df.to_dict('records')
    
    # Define constraints
    grid_capacity = 2500.0 # 2.5 MW peak grid capacity for this demo
    station_capacities = {f"ST{str(i).zfill(3)}": 500.0 for i in range(1, 21)} # Generous station capacities
    
    print("\nRunning Baseline (ASAP) Schedule...")
    # Give baseline infinite grid capacity so we can see what the natural peak would be
    baseline_res = run_baseline_schedule(requests, 99999.0, station_capacities, dt_hours=0.5) 
    
    if not baseline_res['feasible']:
        print(f"Baseline FAILED: {baseline_res['reason']}")
    else:
        print(f"Baseline Peak Load: {baseline_res['peak_load']:.2f} kW")
        
    print("\nRunning SmartCharge (LP) Schedule...")
    smart_res = run_smart_schedule(requests, grid_capacity, station_capacities, dt_hours=0.5)
    
    if not smart_res['feasible']:
        print(f"SmartCharge FAILED: {smart_res['reason']}")
    else:
        print(f"SmartCharge Peak Load: {smart_res['peak_load']:.2f} kW")
        
    if baseline_res['feasible'] and smart_res['feasible']:
        reduction = (baseline_res['peak_load'] - smart_res['peak_load']) / baseline_res['peak_load'] * 100
        print(f"\nPeak Load Reduction: {reduction:.1f}%")
        
        # Calculate load over time
        slots, _ = discretize_time(requests, 0.5)
        
        # Baseline total grid load
        base_grid = np.zeros(len(slots))
        for ev, schedule in baseline_res['schedule'].items():
            base_grid += np.array(schedule)
            
        # Smart total grid load
        smart_grid = np.zeros(len(slots))
        for ev, schedule in smart_res['schedule'].items():
            smart_grid += np.array(schedule)
            
        # Plot
        plt.figure(figsize=(12, 6))
        plt.plot(slots, base_grid, label='Baseline (Dumb) Charging', color='red', alpha=0.8, linestyle='--')
        plt.plot(slots, smart_grid, label='SmartCharge (Optimized)', color='green', alpha=0.9, linewidth=2)
        plt.fill_between(slots, smart_grid, color='green', alpha=0.1)
        
        plt.title('Total Grid Load: Baseline vs SmartCharge (Evening Peak Scenario)')
        plt.ylabel('Power Demand (kW)')
        plt.xlabel('Time')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        out_dir = r'C:\Users\vinay\.gemini\antigravity-ide\brain\16410316-46b0-45cd-8bc2-3ebb6aa2124d\scratch'
        os.makedirs(out_dir, exist_ok=True)
        plot_path = os.path.join(out_dir, 'optimization_demo.png')
        plt.savefig(plot_path, bbox_inches='tight')
        plt.close()
        
        print(f"\nGenerated load curve chart at: {plot_path}")

if __name__ == '__main__':
    main()
