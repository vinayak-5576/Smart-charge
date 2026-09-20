# ⚡ SmartCharge // Grid Intelligence OS

> **Automotive-Grade Grid-Aware EV Charging Optimization Platform**  
> Coordinating fleet-scale Electric Vehicle dispatch with Machine Learning demand forecasting and Linear Programming peak shaving.

---

## 🌟 Overview

As Electric Vehicle adoption scales exponentially, uncoordinated charging creates severe grid congestion and transformer overloads during peak hours. **SmartCharge** coordinates the charging schedules of hundreds to thousands of EVs simultaneously. 

By combining a **48-Hour Random Forest Load Forecast** with a **Linear Programming (LP) Water-Filling Optimization Engine**, SmartCharge flattens aggregate demand, guarantees zero substation capacity violations, and ensures 100% departure deadline compliance for all vehicles.

---

## 🏎️ Automotive-Grade Command Center (AERA-Inspired UI)

SmartCharge features a high-contrast, pure-black cockpit design system inspired by modern automotive telemetry interfaces:

- **Instrument Cluster Command Center (`/`)**:
  - **Tri-Pane Cockpit**: Live dispatch ratio with dynamic load bar, central circular peak load speedometer with substation limit badge (`CEILING 2,500 kW`), and connected fleet telemetry.
  - **Power Flow Telemetry**: Real-time distribution visualization (`[GRID] ─── [CHARGERS] ─── [EVs]`).
  - **48-Hour High-Contrast Forecast Curve**: Recharts telemetry comparing forecasted background demand against physical substation thresholds.

- **What-If Simulation Sandbox (`/simulation`)**:
  - **Automotive Presets**: Toggle between `[ECO]`, `[COMFORT]`, and `[AGGRESSIVE]` optimization buffers.
  - **Stress Test Controls**: Real-time sliders for EV fleet growth (up to +1000%) and midday solar offset (+200%).
  - **Comparative Load Shifting**: Side-by-side bar chart benchmarking dumb unmanaged charging against deterministic SmartCharge dispatch.

- **Fleet Charging Schedule & Dispatch Table (`/schedule`)**:
  - Granular telemetry table featuring EV ID, port attachment, window durations, energy required, and live battery SOC progress bars.
  - Interactive **Cockpit HUD Modal** with battery charge delta, charger output ratings, and solver dispatch advice.

- **Infrastructure Planning Workspace (`/planning`)**:
  - Simultaneous dual-scenario optimization benchmarking (Scenario A vs. Scenario B).
  - Side-by-side KPI outcomes and comparative dispatch profiles.

- **Grid Diagnostic Alarms (`/alerts`) & Cryptographic Audit Ledger (`/audit`)**:
  - Priority alarm feed with instant acknowledgment.
  - Immutable operator action ledger with monospace timestamps and category tags.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React, Vite, Recharts, Lucide Icons, Vanilla CSS (AERA Dark Design System) |
| **Typography** | `Inter` (UI Sans) + `JetBrains Mono` (Telemetry & Numeric Readouts) |
| **Backend API** | Python 3.11, FastAPI, Uvicorn, Mangum (AWS Lambda ASGI adapter) |
| **Machine Learning** | Scikit-learn (Random Forest Regressor), Pandas, NumPy |
| **Optimization Engine** | PuLP (CBC Linear Programming Solver) |
| **Cloud & Storage** | AWS Lambda, API Gateway, DynamoDB, S3, Docker, AWS SAM |

---

## 🚀 Getting Started Locally

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**

---

### 1. Start the Backend API (FastAPI)

```bash
# Clone the repository
git clone https://github.com/vinayak-5576/Smart-charge.git
cd Smart-charge

# Create and activate virtual environment
python -m venv .venv
source .venv/Scripts/activate      # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Launch FastAPI server
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
The API documentation is accessible at `http://localhost:8000/docs`.

---

### 2. Start the Frontend (Vite Cockpit)

In a separate terminal window:

```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```

Navigate to **`http://localhost:5173/`** to view the live SmartCharge Cockpit.

---

## 📊 How It Works

```
 ┌───────────────────────────┐      ┌───────────────────────────┐
 │   48-Hour ML Forecast     │      │   EV Dispatch Requests    │
 │ (Random Forest Regressor) │      │ (Arrival, Deadline, kWh)  │
 └─────────────┬─────────────┘      └─────────────┬─────────────┘
               │                                  │
               ▼                                  ▼
 ┌──────────────────────────────────────────────────────────────┐
 │             SmartCharge LP Optimization Engine               │
 │           (PuLP Deterministic Water-Filling Model)           │
 └──────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │         Coordinated Fleet Charging Schedule & Telemetry      │
 │    100% Deadline Compliance • Zero Grid Capacity Violations  │
 └──────────────────────────────────────────────────────────────┘
```

1. **Predictive Baseline Load**: The Random Forest regressor predicts 48 hours of background electrical demand across 30-minute intervals.
2. **Dynamic Headroom Calculation**: The system computes the margin between forecasted demand and maximum transformer capacity (`2,500 kW`).
3. **Linear Program Dispatch**: Using water-filling peak-shaving constraints, the solver assigns charging power to optimal low-stress intervals.
4. **Guaranteed Delivery**: Hard constraints ensure every EV reaches its target State-of-Charge (SOC) prior to its departure deadline.

---

## 📄 License
This project is open-source under the MIT License.
