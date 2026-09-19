# ⚡ SmartCharge: Grid-Aware EV Charging Optimization Platform

SmartCharge is an intelligent, end-to-end platform designed to optimize Electric Vehicle (EV) charging at scale. By combining **Machine Learning (Random Forest Forecasting)** with **Linear Programming (LP) Optimization**, SmartCharge coordinates the charging schedules of hundreds of EVs simultaneously to prevent electrical grid overload while ensuring every vehicle meets its departure deadline.

## 🌟 Key Features

### 1. 📈 Predictive Grid Demand Forecasting
- Uses a trained **Random Forest Machine Learning model** to predict baseline electrical grid demand 48 hours into the future.
- Analyzes historical patterns, time-of-day, and weather correlations to accurately identify upcoming grid stress periods.
- Serves as the foundation for the "safe zone" calculation for EV charging.

### 2. ⚡ SmartCharge LP Optimization Engine
- Takes in hundreds of EV requests (arrival time, energy required, departure deadline).
- Uses **Linear Programming (PuLP)** to intelligently distribute charging power across time.
- **Minimizes maximum peak load** (Peak Shaving) through a deterministic water-filling scheduling algorithm.
- Mathematically guarantees **100% deadline compliance** and zero grid constraint violations.

### 3. 💻 Interactive React Command Center
- **Dashboard:** Real-time visibility into the grid's capacity, active EVs, and the 48-hour forecast vs. capacity limits.
- **Simulation/Impact:** A strategic simulation sandbox to compare "Dumb Charging" (baseline) vs. "Smart Charging" (optimized), demonstrating actionable Peak Reduction % metrics.
- **Charging Schedule:** Granular, vehicle-by-vehicle dispatch tables showing dynamic throttling and assigned power.

### 4. ☁️ AWS Cloud Architecture (Ready)
- Built on a modern **FastAPI** Python backend.
- Designed for seamless serverless deployment using **AWS Lambda** (Container Image).
- Ready for persistence integration with **AWS DynamoDB** and **S3**.

## 🛠️ Technology Stack
- **Frontend:** React, Vite, Recharts, Vanilla CSS
- **Backend/API:** Python, FastAPI, Mangum
- **Machine Learning:** Scikit-learn (Random Forest Regressor), Pandas, NumPy
- **Optimization Engine:** PuLP (Linear Programming CBC solver)
- **Deployment/Cloud:** Docker, AWS SAM, AWS Lambda, API Gateway

## 🚀 Getting Started Locally

### Prerequisites
- Python 3.11+
- Node.js (for the frontend)

### 1. Start the Backend API
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/Scripts/activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn api.main:app --port 8000
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173/` to view the SmartCharge Command Center.

## 📊 How It Works
1. **The Forecast:** The ML model generates a 48-hour background load curve.
2. **The Requests:** EVs plug in, generating energy demands and hard departure deadlines.
3. **The Optimizer:** The system calculates the exact difference between the forecasted load and maximum grid capacity, fitting EV charging into the "valleys" of demand to avoid creating new peaks.
4. **The Schedule:** Dispatch instructions are generated for every minute.

---
*Built to solve the modern grid congestion crisis caused by EV adoption at scale.*
