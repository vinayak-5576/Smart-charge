import pandas as pd
import numpy as np
import pulp
import datetime

def get_overlap_hours(start1, end1, start2, end2):
    latest_start = max(start1, start2)
    earliest_end = min(end1, end2)
    delta = (earliest_end - latest_start).total_seconds() / 3600.0
    return max(0.0, delta)

def discretize_time(requests, dt_hours=1.0):
    arr_times = [pd.to_datetime(r['arrival_time']) for r in requests]
    dep_times = [pd.to_datetime(r['departure_deadline']) for r in requests]
    
    min_time = min(arr_times).floor('1h')
    max_time = max(dep_times).ceil('1h')
    
    slots = pd.date_range(start=min_time, end=max_time, freq=f'{int(dt_hours*60)}min')
    if len(slots) < 2:
        slots = pd.date_range(start=min_time, periods=2, freq=f'{int(dt_hours*60)}min')
    return slots[:-1], min_time 

def run_baseline_schedule(requests, grid_capacity, station_capacities, background_load=None, dt_hours=1.0):
    slots, _ = discretize_time(requests, dt_hours)
    n_slots = len(slots)
    
    if background_load is None:
        background_load = np.zeros(n_slots)
    
    schedule = {r['ev_id']: np.zeros(n_slots) for r in requests}
    station_load = {s: np.zeros(n_slots) for s in station_capacities}
    grid_load = background_load.copy()
    
    violations = 0
    missed_deadlines = 0
    
    for r in requests:
        ev = r['ev_id']
        arr = pd.to_datetime(r['arrival_time'])
        dep = pd.to_datetime(r['departure_deadline'])
        energy_req = r['energy_required_kWh']
        max_power = r['max_charging_power_kW']
        station = r['station_id']
        
        energy_delivered = 0.0
        
        for i, t in enumerate(slots):
            slot_end = t + pd.Timedelta(hours=dt_hours)
            overlap = get_overlap_hours(arr, dep, t, slot_end)
            
            if overlap > 0 and energy_delivered < energy_req:
                max_energy_in_slot = max_power * overlap
                energy_needed = energy_req - energy_delivered
                deliver_energy = min(max_energy_in_slot, energy_needed)
                p_avg = deliver_energy / dt_hours
                
                schedule[ev][i] = p_avg
                if station in station_load:
                    station_load[station][i] += p_avg
                grid_load[i] += p_avg
                energy_delivered += deliver_energy
                
        if energy_delivered < energy_req - 0.01:
            missed_deadlines += 1
            violations += 1
            
    # Check capacity constraints
    for s, load in station_load.items():
        cap = station_capacities.get(s, 0)
        violations += np.sum(load > cap + 0.01)
            
    grid_violations = int(np.sum(grid_load > grid_capacity + 0.01))
    violations += grid_violations
        
    reason = "Grid capacity exceeded" if grid_violations > 0 else ("Station capacity exceeded" if violations > 0 else "Missed deadlines")
    return {
        'feasible': bool(violations == 0),
        'reason': reason if violations > 0 else "",
        'violations': int(violations),
        'grid_violations': int(grid_violations),
        'missed_deadlines': int(missed_deadlines),
        'schedule': {k: v.tolist() for k, v in schedule.items()},
        'peak_load': float(np.max(grid_load)),
        'total_energy': float(np.sum(grid_load) * dt_hours),
        'slots': slots
    }

def run_smart_schedule(requests, grid_capacity, station_capacities, background_load=None, dt_hours=1.0, cost_profile=None, renewable_profile=None):
    slots, _ = discretize_time(requests, dt_hours)
    n_slots = len(slots)
    
    if background_load is None:
        background_load = np.zeros(n_slots)
        
    prob = pulp.LpProblem("SmartCharge_Optimization", pulp.LpMinimize)
    
    P = {}
    for r in requests:
        ev = r['ev_id']
        P[ev] = {}
        arr = pd.to_datetime(r['arrival_time'])
        dep = pd.to_datetime(r['departure_deadline'])
        
        for i, t in enumerate(slots):
            slot_end = t + pd.Timedelta(hours=dt_hours)
            overlap = get_overlap_hours(arr, dep, t, slot_end)
            
            if overlap > 0:
                upbound = r['max_charging_power_kW'] * (overlap / dt_hours)
                P[ev][i] = pulp.LpVariable(f"P_{ev}_{i}", lowBound=0, upBound=upbound)
            else:
                P[ev][i] = 0
                
    Z = pulp.LpVariable("Z_PeakLoad", lowBound=0)
    
    # Generate default TOU Cost profile if not provided
    if cost_profile is None:
        cost_profile = np.ones(n_slots)
        for i, t in enumerate(slots):
            if 16 <= t.hour < 21:
                cost_profile[i] = 2.0  # Peak pricing
            elif 0 <= t.hour < 6:
                cost_profile[i] = 0.5  # Off-peak pricing
                
    # Generate default Renewable (Solar) profile if not provided
    if renewable_profile is None:
        renewable_profile = np.zeros(n_slots)
        for i, t in enumerate(slots):
            if 10 <= t.hour < 15:
                renewable_profile[i] = 1.5 # High solar
    
    # Secondary Objectives: Penalize delay, minimize cost, maximize renewable usage
    # Penalty weights must be small enough so Z (Peak Load) still dominates grid safety
    weight_peak = 1.0
    weight_cost = 0.005 
    weight_renewable = -0.01 # Negative cost (reward) for using renewables
    weight_delay = 0.0001
    
    delay_penalty = 0
    cost_penalty = 0
    renewable_reward = 0
    
    for r in requests:
        ev = r['ev_id']
        arr = pd.to_datetime(r['arrival_time'])
        for i, t in enumerate(slots):
            if type(P[ev][i]) != int: # Check if it is an LpVariable
                # Delay penalty
                delay_hours = max(0, (t - arr).total_seconds() / 3600.0)
                delay_penalty += P[ev][i] * delay_hours * weight_delay
                
                # TOU Cost penalty
                cost_penalty += P[ev][i] * cost_profile[i] * weight_cost
                
                # Renewable Reward
                renewable_reward += P[ev][i] * renewable_profile[i] * weight_renewable
                
    # New Multi-Objective Function
    prob += (weight_peak * Z) + delay_penalty + cost_penalty + renewable_reward
    
    for r in requests:
        ev = r['ev_id']
        prob += pulp.lpSum([P[ev][i] * dt_hours for i in range(n_slots)]) >= r['energy_required_kWh']
        
    for i in range(n_slots):
        for s in station_capacities:
            station_evs = [r['ev_id'] for r in requests if r['station_id'] == s]
            if station_evs:
                prob += pulp.lpSum([P[ev][i] for ev in station_evs]) <= station_capacities[s]
                
    for i in range(n_slots):
        total_ev_load = pulp.lpSum([P[r['ev_id']][i] for r in requests])
        prob += total_ev_load + background_load[i] <= grid_capacity
        prob += total_ev_load + background_load[i] <= Z
        
    prob.solve(pulp.PULP_CBC_CMD(msg=False))
    
    if pulp.LpStatus[prob.status] != 'Optimal':
        # Fallback to run baseline if infeasible, just to return a structure, but marked infeasible
        res = run_baseline_schedule(requests, grid_capacity, station_capacities, background_load, dt_hours)
        res['feasible'] = False
        res['reason'] = f"Solver status: {pulp.LpStatus[prob.status]}"
        return res
        
    schedule = {r['ev_id']: np.zeros(n_slots) for r in requests}
    grid_load = np.zeros(n_slots)
    
    for r in requests:
        ev = r['ev_id']
        for i in range(n_slots):
            val = pulp.value(P[ev][i])
            if val and val > 0:
                schedule[ev][i] = val
                grid_load[i] += val
                
    return {
        'feasible': True,
        'violations': 0,
        'grid_violations': 0,
        'missed_deadlines': 0,
        'schedule': {k: v.tolist() for k, v in schedule.items()},
        'peak_load': float(pulp.value(Z)),
        'total_energy': float(np.sum(grid_load) * dt_hours),
        'slots': slots
    }
