import os
import sys
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

# Ensure project root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.smartcharge_service import run_forecast_optimized_simulation
from api.aws_storage import Storage
from api.database import Database
from models.integration.forecast_optimizer import generate_aligned_forecast
import numpy as np

app = FastAPI(title="SmartCharge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/simulation")
def create_simulation(config: dict = Body(...)):
    """
    Executes a SmartCharge simulation based on the provided configuration.
    """
    try:
        # Execute the simulation using the service layer
        result = run_forecast_optimized_simulation(config)
        
        sim_id = result.get('simulation_id')
        if not sim_id:
            raise HTTPException(status_code=500, detail="Simulation failed to generate an ID")
            
        # Persist the full result
        saved = Storage.save_simulation(sim_id, result)
        if not saved:
            raise HTTPException(status_code=500, detail="Failed to persist simulation results")
            
        # Evaluate for alerts
        if not result.get('feasible', True):
            Database.save_alert({
                "type": "INFEASIBLE_SCHEDULE",
                "message": f"Simulation {sim_id} was infeasible. Reason: {result.get('failure_reason', 'Unknown')}",
                "severity": "HIGH"
            })
        elif not result.get('grid_compliance', True):
            Database.save_alert({
                "type": "GRID_VIOLATION",
                "message": f"Simulation {sim_id} violates grid capacity constraints.",
                "severity": "CRITICAL"
            })
            
        # Return a summarized version (omit the bulky schedule/timeseries)
        summary = {k: v for k, v in result.items() if k not in ['schedule']}
        if 'forecast' in summary and 'time_series' in summary['forecast']:
            del summary['forecast']['time_series']
            
        return summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate_what_if")
def simulate_what_if(config: dict = Body(...)):
    """
    Executes a What-If Scenario simulation for infrastructure planning.
    Expects ev_growth_percent and solar_capacity_modifier.
    """
    try:
        # Default scenario to mock for simulations
        config['scenario_type'] = 'mock'
        result = run_forecast_optimized_simulation(config)
        
        sim_id = result.get('simulation_id')
        if not sim_id:
            raise HTTPException(status_code=500, detail="Simulation failed to generate an ID")
            
        # Do not persist what-if simulations to AWS Storage to save cost/clutter
        # Return full results so frontend can draw graphs
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/alerts")
def get_alerts():
    """
    Retrieves all active alerts (e.g. congestion risks, infeasibility).
    """
    try:
        alerts = Database.get_alerts()
        return {"alerts": alerts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/simulation/{simulation_id}")
def get_simulation(simulation_id: str):
    """
    Retrieves the summary metrics of a previously run simulation.
    """
    data = Storage.get_simulation(simulation_id)
    if not data:
        raise HTTPException(status_code=404, detail="Simulation not found")
        
    summary = {k: v for k, v in data.items() if k not in ['schedule']}
    if 'forecast' in summary and 'time_series' in summary['forecast']:
        del summary['forecast']['time_series']
        
    return summary

@app.get("/schedule/{simulation_id}")
def get_schedule(simulation_id: str):
    """
    Retrieves the detailed EV charging schedules for a simulation.
    """
    data = Storage.get_simulation(simulation_id)
    if not data:
        raise HTTPException(status_code=404, detail="Simulation not found")
        
    return {"simulation_id": simulation_id, "schedule": data.get("schedule", {})}

@app.get("/forecast")
def get_forecast():
    """
    Returns base 48-hour forecast data needed by the frontend.
    """
    try:
        dt_hours = 0.5
        num_slots = 96 # 48 hours
        F_t = generate_aligned_forecast(num_slots, dt_hours, 0.0)
        
        return {
            "peak_kW": float(np.max(F_t)),
            "average_kW": float(np.mean(F_t)),
            "time_series": [float(x) for x in F_t],
            "grid_capacity": 2500.0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions")
def get_sessions():
    """
    Retrieves all active EV charging sessions.
    """
    try:
        sessions = Database.get_active_sessions()
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sessions")
def create_session(session_data: dict = Body(...)):
    """
    Registers a new EV charging session.
    """
    try:
        # In a real MVP, we'd validate the body (e.g. using Pydantic models).
        session_id = Database.save_ev_session(session_data)
        return {"session_id": session_id, "status": "registered"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chargers")
def register_charger(charger_data: dict = Body(...)):
    """
    Registers or updates charger infrastructure details.
    """
    try:
        charger_id = Database.save_charger(charger_data)
        return {"charger_id": charger_id, "status": "registered"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Create the Mangum handler for AWS Lambda
handler = Mangum(app)
