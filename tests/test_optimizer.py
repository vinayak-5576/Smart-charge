import pytest
import datetime
from models.optimization.engine import run_baseline_schedule, run_smart_schedule

def create_mock_requests(num, flexibility_buffer_hours, same_station=False):
    requests = []
    base_time = datetime.datetime(2025, 4, 1, 10, 0, 0)
    import random
    for i in range(num):
        arrival = base_time + datetime.timedelta(minutes=3 * i)
        power = 10.0
        energy = 20.0
        min_time = energy / power
        deadline = arrival + datetime.timedelta(hours=min_time + flexibility_buffer_hours)
        
        requests.append({
            'ev_id': f'EV_{i}',
            'station_id': 'ST001' if same_station else f'ST{str(i % 5).zfill(3)}',
            'arrival_time': arrival.strftime('%Y-%m-%d %H:%M:%S'),
            'departure_deadline': deadline.strftime('%Y-%m-%d %H:%M:%S'),
            'energy_required_kWh': energy,
            'max_charging_power_kW': power,
            'initial_soc': round(random.uniform(0.1, 0.8), 2)
        })
    return requests

def test_normal_scenario():
    requests = create_mock_requests(5, flexibility_buffer_hours=4.0)
    station_caps = {f'ST{str(i).zfill(3)}': 50.0 for i in range(5)}
    grid_cap = 100.0
    
    res_base = run_baseline_schedule(requests, grid_cap, station_caps)
    assert res_base['feasible'] is True
    
    res_smart = run_smart_schedule(requests, grid_cap, station_caps)
    assert res_smart['feasible'] is True
    assert res_smart['peak_load'] <= res_base['peak_load']

def test_evening_peak():
    # Many requests at the same time, high flexibility
    requests = create_mock_requests(10, flexibility_buffer_hours=8.0, same_station=True)
    # Force all to arrive at exactly the same time to create a peak
    arr_time = "2025-04-01 18:00:00"
    for r in requests:
        r['arrival_time'] = arr_time
        r['departure_deadline'] = "2025-04-02 08:00:00"
        
    station_caps = {'ST001': 100.0}
    grid_cap = 50.0 # Strict grid
    
    # Baseline will fail because 10 EVs * 10 kW = 100 kW > Grid Cap (50 kW)
    res_base = run_baseline_schedule(requests, grid_cap, station_caps)
    assert res_base['feasible'] is False
    assert "Grid capacity exceeded" in res_base['reason']
    
    # Smart should succeed because it can spread 200 kWh over 14 hours
    res_smart = run_smart_schedule(requests, grid_cap, station_caps)
    assert res_smart['feasible'] is True
    assert res_smart['peak_load'] <= 50.0

def test_tight_deadlines():
    # 0 flexibility
    requests = create_mock_requests(5, flexibility_buffer_hours=0.0, same_station=True)
    station_caps = {'ST001': 100.0}
    grid_cap = 100.0
    
    res_smart = run_smart_schedule(requests, grid_cap, station_caps)
    assert res_smart['feasible'] is True
    
    # With 0 flexibility, smart peak should be exactly the same as baseline peak
    res_base = run_baseline_schedule(requests, grid_cap, station_caps)
    assert res_smart['peak_load'] == pytest.approx(res_base['peak_load'], abs=1e-2)

def test_insufficient_charger_capacity():
    requests = create_mock_requests(5, flexibility_buffer_hours=4.0, same_station=True)
    # Total power needed is 50 kW initially for baseline
    # Set station capacity to 5 kW (less than 1 EV)
    station_caps = {'ST001': 5.0}
    grid_cap = 100.0
    
    res_smart = run_smart_schedule(requests, grid_cap, station_caps)
    # 5 EVs * 20 kWh = 100 kWh over 5-9 hours. 5 kW max * 9 hours = 45 kWh. Not enough.
    assert res_smart['feasible'] is False

def test_impossible_scenario():
    requests = create_mock_requests(1, flexibility_buffer_hours=0.0)
    # Tamper with deadline to make it impossible
    requests[0]['departure_deadline'] = requests[0]['arrival_time']
    station_caps = {'ST000': 100.0}
    grid_cap = 100.0
    
    res_smart = run_smart_schedule(requests, grid_cap, station_caps)
    assert res_smart['feasible'] is False
