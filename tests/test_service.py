import pytest
from services.smartcharge_service import run_forecast_optimized_simulation

def test_service_with_mock_scenario():
    config = {
        'simulation_id': 'test-mock-001',
        'scenario_type': 'mock',
        'num_evs': 10,
        'flexibility_buffer_hours': 4.0,
        'grid_capacity': 2500.0,
        'num_stations': 5,
        'station_capacity': 105.0,
        'dt_hours': 0.5,
        'forecast_modifier': 0.0
    }
    
    result = run_forecast_optimized_simulation(config)
    
    # Check serialization and core keys
    assert isinstance(result, dict)
    assert result['simulation_id'] == 'test-mock-001'
    assert result['ev_requests'] == 10
    assert result['feasible'] is True
    assert 'forecast' in result
    assert isinstance(result['forecast']['peak_kW'], float)
    assert 'schedule' in result
    
    # Baseline vs Optimized peak check (rough)
    assert result['baseline_peak'] >= result['optimized_peak']
    
def test_service_with_invalid_csv():
    config = {
        'simulation_id': 'test-csv-001',
        'scenario_type': 'csv',
        'scenario_file': 'data/scenarios/non_existent.csv'
    }
    
    result = run_forecast_optimized_simulation(config)
    assert result['feasible'] is False
    assert "error" in result
