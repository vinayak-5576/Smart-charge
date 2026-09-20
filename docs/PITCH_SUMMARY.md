# SmartCharge: AI-Powered EV Grid Optimization

## 🚨 The Problem Statement
As electric vehicle (EV) adoption accelerates, power grids are facing unprecedented stress. Currently, most EVs rely on "dumb charging"—the moment a car plugs in, it draws maximum power until it is full. 

When hundreds of EVs plug in simultaneously after work (e.g., 6:00 PM - 9:00 PM), their massive, sudden energy demand stacks on top of the city's already-stressed evening grid. This creates massive **unmanaged power peaks** that exceed the physical limits of local transformers (e.g., 2500 kW thresholds), causing localized blackouts and forcing utility companies to purchase highly expensive emergency power.

## 💡 Our Solution
**SmartCharge** acts as an intelligent traffic controller for electricity. It treats EV charging not as a rigid demand, but as a flexible resource. 

We built a two-part AI and Mathematical Optimization system:
1. **Machine Learning Forecaster:** Analyzes historical grid and station data to predict the base "legacy" electricity demand for the next 48 hours.
2. **Operations Research Optimizer:** Uses advanced Linear Programming (LP) to look at incoming "Smart" EVs. It evaluates their battery requirements against the driver's departure deadline, and mathematically calculates the perfect minute-by-minute charging schedule for every single car. 

The optimizer throttles charging during the city's peak hours and shifts the charging sessions into the quiet midnight "valleys", safely distributing the load.

## 🏆 What We Achieved (Hackathon Highlights)
We successfully built a complete end-to-end data, backend, and frontend system:

- **Mathematical Peak Shaving:** Our optimizer successfully flattens dangerous grid spikes. In our high-stress simulations, we demonstrated the ability to drop unmanaged peak loads from ~2400 kW down to a safe ~1990 kW (a ~17% peak reduction).
- **100% Deadline Compliance:** The algorithm strictly enforces driver deadlines. Every single EV is guaranteed to hit its target battery percentage before the driver needs to leave, completely eliminating range anxiety.
- **Strict Physical Constraints:** We modeled real-world physics. The LP engine ensures that neither individual charging stations (105 kW limit) nor the overall city grid (2500 kW limit) are ever violated.
- **Interactive Command Center:** We built a polished, production-ready React dashboard with live charting. It allows operators to monitor the 48-hour forecasted base curve, visualize the optimized schedule over time, and track grid health.
- **"What-If" Scenario Planning:** We engineered an infrastructure stress-testing tool. City planners can simulate future scenarios (e.g., +160% EV adoption growth or +100% solar additions) to mathematically prove if the current grid can handle the energy transition 5 years from now.

## 🛠️ Tech Stack
- **Data & ML:** Python, Pandas, Scikit-Learn (Random Forest Regressor)
- **Optimization:** PuLP (CBC Linear Programming Solver)
- **Backend API:** FastAPI, Uvicorn
- **Frontend UI:** React, Vite, Recharts, CSS Glassmorphism
