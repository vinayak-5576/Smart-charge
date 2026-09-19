import os
import sys
import json
import requests
import pytest
from datetime import datetime
from pydantic import BaseModel

# Add root directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.smartcharge_service import run_forecast_optimized_simulation

API_URL = os.environ.get("AWS_API_URL", "http://localhost:8000")
TOLERANCE = 1e-4

def compare_floats(val1, val2):
    return abs(val1 - val2) <= TOLERANCE

def generate_parity_report(local_res, api_res):
    
    # 1. Gather Metrics
    metrics_to_compare = {
        "forecast_peak": (local_res['forecast']['peak_kW'], api_res['forecast']['peak_kW']),
        "forecast_average": (local_res['forecast']['average_kW'], api_res['forecast']['average_kW']),
        "baseline_peak": (local_res['baseline_peak'], api_res['baseline_peak']),
        "optimized_peak": (local_res['optimized_peak'], api_res['optimized_peak']),
        "peak_reduction": (local_res['peak_reduction'], api_res['peak_reduction']),
        "energy_delivered": (local_res['energy_delivered'], api_res['energy_delivered']),
        "deadline_compliance": (local_res['deadline_compliance'], api_res['deadline_compliance']),
    }
    
    boolean_metrics = {
        "grid_compliance": (local_res['grid_compliance'], api_res['grid_compliance']),
        "feasible": (local_res['feasible'], api_res['feasible'])
    }
    
    int_metrics = {
        "constraint_violations": (local_res['constraint_violations'], api_res['constraint_violations'])
    }
    
    report_lines = [
        "# AWS Parity Test Report",
        f"*Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}*",
        "",
        "## Configuration",
        "Deterministic scenario run simultaneously on local Python execution and Serverless API.",
        "",
        "## 1. Floating Point Metrics",
        "| Metric | Local | AWS API | Abs Diff | Passed |",
        "|--------|-------|---------|----------|--------|"
    ]
    
    all_passed = True
    
    for metric, (v_loc, v_api) in metrics_to_compare.items():
        diff = abs(v_loc - v_api)
        passed = compare_floats(v_loc, v_api)
        if not passed:
            all_passed = False
        passed_str = "✅" if passed else "❌"
        report_lines.append(f"| {metric} | {v_loc:.5f} | {v_api:.5f} | {diff:.5f} | {passed_str} |")
        
    report_lines.append("")
    report_lines.append("## 2. Integer / Boolean Metrics")
    report_lines.append("| Metric | Local | AWS API | Passed |")
    report_lines.append("|--------|-------|---------|--------|")
    
    for metric, (v_loc, v_api) in {**boolean_metrics, **int_metrics}.items():
        passed = (v_loc == v_api)
        if not passed:
            all_passed = False
        passed_str = "✅" if passed else "❌"
        report_lines.append(f"| {metric} | {v_loc} | {v_api} | {passed_str} |")
        
    report_lines.append("")
    report_lines.append("## Conclusion")
    if all_passed:
        report_lines.append("**Result:** ✅ SUCCESS. Local and AWS API executions yield mathematically identical outputs within numerical tolerance.")
    else:
        report_lines.append("**Result:** ❌ FAILED. One or more metrics diverged.")
        
    # Write to file
    report_content = "\n".join(report_lines)
    os.makedirs('reports', exist_ok=True)
    with open('reports/aws_parity_test.md', 'w', encoding='utf-8') as f:
        f.write(report_content)
        
    print(report_content)
    
    if not all_passed:
        sys.exit(1)

def run_test():
    print("========================================")
    print("STARTING PARITY TEST")
    print("========================================")
    
    config = {
        'simulation_id': 'parity-test-001',
        'scenario_type': 'mock',
        'num_evs': 100, # Using 100 for fast execution
        'flexibility_buffer_hours': 4.0,
        'grid_capacity': 2500.0,
        'num_stations': 5,
        'station_capacity': 105.0,
        'dt_hours': 0.5,
        'forecast_modifier': 0.0
    }
    
    # 1. Run local
    print("\nRunning local Python execution...")
    local_result = run_forecast_optimized_simulation(config)
    
    # 2. Run API
    print("\nRunning AWS API execution...")
    api_resp = requests.post(f"{API_URL}/simulation", json=config)
    if api_resp.status_code != 200:
        print(f"API Failed: {api_resp.text}")
        sys.exit(1)
        
    api_result = api_resp.json()
    
    # 3. Generate Report
    print("\nGenerating Parity Report...")
    generate_parity_report(local_result, api_result)

if __name__ == '__main__':
    run_test()
