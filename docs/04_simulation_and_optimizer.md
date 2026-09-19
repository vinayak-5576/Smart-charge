# Simulation & Optimizer Assumptions

## 1. The Synthetic EV Simulator
To test the optimization engine, we generated synthetic charging scenarios of 500 EVs each (`scripts/simulator.py`). 

### Hardware & SOC Generation
Instead of arbitrary random numbers, we used the historical distributions from the dataset:
- **Battery Capacity:** Uniformly 30 to 100 kWh (or 70-100 for high stress).
- **Charging Power:** Randomly selected from standard hardware tiers [7, 11, 22, 50] kW.
- **Initial SOC:** Uniformly 10% to 60%. Target SOC: 80% to 100%.

### Departure Deadline Logic
Deadlines are not arbitrary. They are calculated based on physical charging constraints plus a configurable flexibility buffer:
1. `Energy_Req_kWh = Battery_Cap * (Target_SOC - Initial_SOC)`
2. `Min_Charging_Time_h = Energy_Req_kWh / Charging_Power`
3. `Departure_Deadline = Arrival_Time + Min_Charging_Time + Flexibility_Buffer`

*The Flexibility Buffer (e.g., 4 to 8 hours for overnight charging) is the sole mathematical window that allows the optimizer to shift loads.*

---

## 2. Optimization Engine Architecture
The core engine (`models/optimization/engine.py`) uses **Linear Programming (LP)** via the PuLP library.

### The Objective Function
The engine minimizes a dual objective:
`Minimize: Z + (0.0001 * Total_Charging_Delay)`

1. **`Z` (Peak Grid Load):** The absolute maximum power drawn across all time slots. This is the primary objective.
2. **`Total_Charging_Delay`:** A small penalty applied to power delivered later in the time window. This forces the solver to charge EVs as early as possible *without* increasing the peak load, mimicking user preference and reducing range anxiety.

### Hard Constraints (Never Violated)
- **Arrival Time:** An EV cannot draw power before it arrives.
- **Departure Deadline:** An EV must receive 100% of its required energy before departure.
- **Station Capacity:** The sum of EV power at a specific station cannot exceed that station's physical hardware limits. (Using realistic 50kW-250kW limits per station).
- **Grid Capacity:** Total system load cannot exceed the global grid limit (e.g., 2500 kW).

### Feasibility Fallback
If the mathematical solver detects that the hardware limits are too small to charge the assigned EVs before their deadlines, it refuses to generate a fake schedule. It returns `Feasible: False` and falls back to a 0% reduction baseline. This strict logic was proven during the `HIGH_STRESS` and `TIGHT_DEADLINE` validation scenarios where localized station congestion correctly caused gridlock.
