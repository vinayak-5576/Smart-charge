import numpy as np
import pytest
from models.integration.forecast_optimizer import generate_aligned_forecast, run_forecast_optimized_simulation
from tests.test_optimizer import create_mock_requests

def test_generate_aligned_forecast():
    # Test that we can generate a forecast correctly aligned
    num_slots = 10
    dt_hours = 0.5
    
    # 10 slots of 30 mins = 5 hours of forecast needed
    forecast = generate_aligned_forecast(num_slots, dt_hours, modifier_percent=0.0)
    
    # Length should match exactly
    assert len(forecast) == num_slots
    
    # Because of step interpolation, slot 0 and slot 1 should be identical for 0.5 dt_hours
    # But wait, they might be different if the forecast spans different hours. 
    # But specifically, index 2*i and 2*i+1 come from the same hour.
    assert forecast[0] == forecast[1]
    assert forecast[2] == forecast[3]

def test_independent_populations_invariant():
    # Test that U(t) == F(t) as per DESIGN A (two independent EV populations)
    requests = create_mock_requests(5, flexibility_buffer_hours=4.0)
    station_caps = {f'ST{str(i).zfill(3)}': 105.0 for i in range(5)}
    grid_cap = 2500.0
    
    results = run_forecast_optimized_simulation(
        requests=requests,
        grid_capacity=grid_cap,
        station_capacities=station_caps,
        dt_hours=0.5,
        forecast_modifier=0.0
    )
    
    F_t = results['forecast_F_t']
    B_t = results['synthetic_baseline_B_t']
    U_t = results['background_load_U_t']
    
    for i in range(len(F_t)):
        assert abs(U_t[i] - F_t[i]) < 1e-6
