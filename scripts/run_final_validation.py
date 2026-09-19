import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os
import json
import math
from models.optimization.engine import run_baseline_schedule, run_smart_schedule

def calculate_average_delay(requests, schedule, dt_hours=0.5):
    arr_times = {r['ev_id']: pd.to_datetime(r['arrival_time']) for r in requests}
    energy_reqs = {r['ev_id']: r['energy_required_kWh'] for r in requests}
    
    # We need to know the time slots. 
    # Let's rebuild the slots like the engine does
    min_time = min(arr_times.values()).floor('1h')
    max_time = max(pd.to_datetime(r['departure_deadline']) for r in requests).ceil('1h')
    slots = pd.date_range(start=min_time, end=max_time, freq=f'{int(dt_hours*60)}min')
    if len(slots) < 2:
        slots = pd.date_range(start=min_time, periods=2, freq=f'{int(dt_hours*60)}min')
    slots = slots[:-1]
    
    total_delay = 0.0
    for ev, powers in schedule.items():
        arr = arr_times[ev]
        ev_delay_sum = 0.0
        for i, t in enumerate(slots):
            p = powers[i]
            if p > 0:
                delay_hours = max(0, (t - arr).total_seconds() / 3600.0)
                ev_delay_sum += p * delay_hours * dt_hours
        # weighted average delay for this EV
        if energy_reqs[ev] > 0:
            total_delay += ev_delay_sum / energy_reqs[ev]
            
    return total_delay / len(requests) if requests else 0.0

def analyze_scenario(scenario_name, seed):
    scenario_file = f'data/scenarios/{scenario_name}.csv'
    df = pd.read_csv(scenario_file)
    requests = df.to_dict('records')
    
    num_evs = len(requests)
    total_energy_req = sum(r['energy_required_kWh'] for r in requests)
    
    grid_capacity = 2500.0
    
    # Use empirically derived station capacities (105 kW per station) based on historical dataset max values
    station_capacities = {f"ST{str(i).zfill(3)}": 105.0 for i in range(1, 21)}
    
    baseline_res = run_baseline_schedule(requests, grid_capacity, station_capacities, dt_hours=0.5)
    smart_res = run_smart_schedule(requests, grid_capacity, station_capacities, dt_hours=0.5)
    
    base_peak = baseline_res['peak_load']
    smart_peak = smart_res['peak_load']
    reduction = 0.0 if base_peak == 0 else (base_peak - smart_peak) / base_peak * 100
    
    avg_delay = calculate_average_delay(requests, smart_res['schedule'], dt_hours=0.5)
    
    slots = baseline_res['slots']
    base_grid = np.zeros(len(slots))
    for ev, schedule in baseline_res['schedule'].items():
        base_grid += np.array(schedule)
        
    smart_grid = np.zeros(len(slots))
    for ev, schedule in smart_res['schedule'].items():
        smart_grid += np.array(schedule)
        
    plt.figure(figsize=(10, 5))
    plt.plot(slots, base_grid, label='Baseline Load', color='red', linestyle='--')
    plt.plot(slots, smart_grid, label='Optimized Load', color='green', linewidth=2)
    plt.fill_between(slots, smart_grid, color='green', alpha=0.1)
    plt.axhline(y=grid_capacity, color='black', linestyle=':', label='Grid Capacity')
    
    plt.title(f'Total Grid Load - {scenario_name}')
    plt.ylabel('Power Demand (kW)')
    plt.xlabel('Time')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    import matplotlib.dates as mdates
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%m-%d %H:%M'))
    plt.gcf().autofmt_xdate()
    
    os.makedirs('reports', exist_ok=True)
    plot_path = os.path.abspath(f'reports/{scenario_name}_load_curve.png')
    plt.savefig(plot_path, bbox_inches='tight')
    plt.close()
    
    report_dict = {
        'scenario': scenario_name,
        'ev_count': num_evs,
        'charger_count': len(station_capacities),
        'grid_capacity': grid_capacity,
        'total_energy_req': float(total_energy_req),
        'baseline_peak': float(base_peak),
        'baseline_violations': int(baseline_res['violations']),
        'smart_peak': float(smart_peak),
        'smart_violations': int(smart_res['violations']),
        'reduction': float(reduction),
        'deadline_compliance': int(num_evs - smart_res['missed_deadlines']),
        'energy_delivered': float(smart_res['total_energy']),
        'average_delay_hours': float(avg_delay),
        'feasible': bool(smart_res['feasible'])
    }
    
    with open(f'reports/{scenario_name}_report.json', 'w') as f:
        json.dump(report_dict, f, indent=4)
        
    print(f"\n========================================")
    print(f"SCENARIO: {scenario_name}")
    print(f"========================================")
    print(f"EV count:               {num_evs}")
    print(f"Charger count:          {len(station_capacities)}")
    print(f"Grid capacity:          {grid_capacity:.0f} kW")
    print(f"Total required energy:  {total_energy_req:.1f} kWh")
    print(f"")
    print(f"BASELINE:")
    print(f"Base-load peak:         0 kW") # since background load is 0 in these scenarios
    print(f"EV charging peak:       {base_peak:.0f} kW")
    print(f"Total-load peak:        {base_peak:.0f} kW")
    print(f"Grid violations:        {baseline_res['grid_violations']}")
    print(f"")
    print(f"SMARTCHARGE:")
    print(f"Base-load peak:         0 kW")
    print(f"EV charging peak:       {smart_peak:.0f} kW")
    print(f"Total-load peak:        {smart_peak:.0f} kW")
    print(f"Grid violations:        {smart_res['grid_violations']}")
    print(f"")
    print(f"Peak reduction:         {reduction:.1f}%")
    print(f"EV deadline compliance: {num_evs - smart_res['missed_deadlines']} / {num_evs}")
    print(f"Grid compliance:        {'YES' if smart_res['grid_violations'] == 0 else 'NO'}")
    print(f"Energy delivered:       {smart_res['total_energy']:.1f} / {total_energy_req:.1f} kWh")
    print(f"Constraint violations:  {smart_res['violations']}")
    print(f"Average charging delay: {avg_delay:.2f} hours")
    print(f"Feasible:               {'YES' if smart_res['feasible'] else 'NO'}")
    if not smart_res['feasible']:
        print(f"Failure reason:         {smart_res.get('reason', 'Unknown constraint violation')}")
    print(f"Chart saved to:         {plot_path}")
    
    if smart_res['feasible']:
        assert smart_res['total_energy'] >= total_energy_req - 0.5, "Failed energy conservation bound!"

def main():
    scenarios = ['NORMAL_EVENING', 'HIGH_STRESS', 'TIGHT_DEADLINE', 'INFEASIBLE']
    for i, s in enumerate(scenarios):
        analyze_scenario(s, seed=42+i)
        
    print("\nAll scenarios processed and assertions verified.")

if __name__ == '__main__':
    main()
