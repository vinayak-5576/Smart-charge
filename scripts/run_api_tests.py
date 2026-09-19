import requests
import json
import time

API_URL = "http://localhost:8000"

def test_simulation_workflow():
    print("========================================")
    print("1. Testing POST /simulation")
    print("========================================")
    
    config = {
        'simulation_id': 'api-test-001',
        'scenario_type': 'mock',
        'num_evs': 15,
        'flexibility_buffer_hours': 4.0,
        'grid_capacity': 2500.0,
        'num_stations': 5,
        'station_capacity': 105.0,
        'dt_hours': 0.5,
        'forecast_modifier': 0.0
    }
    
    post_res = requests.post(f"{API_URL}/simulation", json=config)
    assert post_res.status_code == 200, f"POST /simulation failed: {post_res.text}"
    
    data = post_res.json()
    print("POST response successful.")
    print(json.dumps(data, indent=2))
    
    sim_id = data.get('simulation_id')
    assert sim_id == 'api-test-001', "Simulation ID mismatch"
    assert data['ev_requests'] == 15, "EV requests mismatch"
    assert data['feasible'] is True, "Simulation infeasible"
    
    print("\n========================================")
    print(f"2. Testing GET /simulation/{sim_id}")
    print("========================================")
    
    get_res = requests.get(f"{API_URL}/simulation/{sim_id}")
    assert get_res.status_code == 200, f"GET /simulation failed: {get_res.text}"
    
    get_data = get_res.json()
    print("GET /simulation response successful.")
    
    assert get_data['optimized_peak'] == data['optimized_peak'], "Data mismatch between POST and GET"
    
    print("\n========================================")
    print(f"3. Testing GET /schedule/{sim_id}")
    print("========================================")
    
    sched_res = requests.get(f"{API_URL}/schedule/{sim_id}")
    assert sched_res.status_code == 200, f"GET /schedule failed: {sched_res.text}"
    
    sched_data = sched_res.json()
    print("GET /schedule response successful.")
    assert len(sched_data['schedule']) > 0, "Schedule is empty"
    
    print("\n========================================")
    print("4. Testing GET /forecast")
    print("========================================")
    
    fc_res = requests.get(f"{API_URL}/forecast")
    assert fc_res.status_code == 200, f"GET /forecast failed: {fc_res.text}"
    
    fc_data = fc_res.json()
    print("GET /forecast response successful.")
    assert 'peak_kW' in fc_data
    assert 'time_series' in fc_data
    assert len(fc_data['time_series']) > 0
    
    print("\n✅ All API tests passed successfully!")

if __name__ == "__main__":
    # Wait for the API to come up if it's running in background
    attempts = 0
    while attempts < 10:
        try:
            requests.get(f"{API_URL}/docs") # FastAPI docs endpoint
            break
        except requests.ConnectionError:
            time.sleep(1)
            attempts += 1
            
    test_simulation_workflow()
