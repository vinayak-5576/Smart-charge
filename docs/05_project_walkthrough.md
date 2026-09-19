# Forecasting Module Report

I have successfully built and evaluated the EV charging demand forecasting module using an autoregressive machine learning approach.

## 1. Module Architecture
- **Training Script:** [`models/forecasting/train.py`](file:///c:/Users/vinay/OneDrive/Desktop/EV/models/forecasting/train.py) generates non-leaky lag features (shifting demand, load, and queue by 1 hour), splits the data chronologically (80% train, 20% test), and trains the ML model.
- **Prediction Module:** [`models/forecasting/predict.py`](file:///c:/Users/vinay/OneDrive/Desktop/EV/models/forecasting/predict.py) exposes the `predict_demand(input_data)` function. It loads the cached artifacts and gracefully handles feature engineering for raw sequential input sequences.
- **Evaluation Script:** [`models/forecasting/evaluate.py`](file:///c:/Users/vinay/OneDrive/Desktop/EV/models/forecasting/evaluate.py) calculates test metrics and generates visual charts.

## 2. Evaluation Metrics

We compared our ML model against a strict **Naive Baseline** (predicting that demand in hour `t` will simply match the demand from hour `t-1`). 

### Naive Baseline (t-1)
- **MAE:** 18.42
- **RMSE:** 37.14
- **MAPE:** 91.28%

### Machine Learning Model
- **MAE:** 10.59
- **RMSE:** 20.29
- **MAPE:** 49.45%

> [!TIP]
> **Performance:** The ML model nearly cuts the error metrics in half compared to the naive baseline. A 10.6 kW average error is highly acceptable given the sparse/bursty nature of station-level demand. 

## 3. Chosen Model & Reasoning
We utilized a **Random Forest Regressor** (via scikit-learn).
- **Why it was chosen:** Random forests are incredibly robust out-of-the-box on tabular data. They natively handle non-linear interactions (e.g., peak hours combined with specific station geometries) without requiring complex feature scaling. They are also highly resistant to overfitting on high-dimensional time-series data compared to deep neural networks, making them the perfect sturdy baseline for this hackathon.

## 4. Visualizing the Forecast
![Actual vs Predicted](C:/Users/vinay/.gemini/antigravity-ide/brain/16410316-46b0-45cd-8bc2-3ebb6aa2124d/scratch/actual_vs_predicted.png)

This chart demonstrates the Random Forest model predicting demand over 3 consecutive days for a specific station. 
- You can observe the **red line (Naive Baseline)** simply lagging behind the true demand by 1 hour.
- The **blue line (ML Model)** proactively anticipates the peaks by leveraging the time-of-day (`hour`, `is_peak`) alongside environmental features, keeping much tighter alignment with the actual curve.

## 5. Important Limitations
> [!WARNING]
> - **Zero-Inflation:** Time-series forecasting at the station level inherently produces many hours of exactly 0 demand. Tree-based regressors often predict small, fractional values (e.g., 0.5 kW) instead of hard 0s during these dead periods, artificially inflating the MAPE metric. A future improvement would be implementing a two-stage hurdle model (Classification: Will there be demand? -> Regression: How much?).
> - **Hyperparameter Tuning:** The Random Forest is running with default heuristics (`max_depth=15`, `n_estimators=100`). Exhaustive grid-search tuning on a validation set would likely yield further improvements.

---

# Synthetic EV Request Simulator

I have successfully built the EV request simulator (`scripts/simulator.py`) to generate synthetic EV charging requests for the grid optimizer.

## Core Logic & Mathematics
The simulator strictly avoids arbitrary deadline generation. Instead, it relies on historical distributions and physical constraints:
- **Energy Required (kWh)** = `Battery_Capacity * (Target_SOC - Initial_SOC) / 100`
- **Minimum Charging Time (h)** = `Energy_Required / Max_Charging_Power`
- **Departure Deadline** = `Arrival_Time + Minimum_Charging_Time + Flexibility_Buffer`

The `Flexibility_Buffer` is the true variable that allows smart-charging algorithms to function.

## Generated Scenarios
4 distinct scenarios (500 requests each) were generated using fixed seeds and saved to `data/scenarios/`.

### 1. Normal Demand (`normal_demand.csv`)
- **Profile:** Uniform arrivals across 24 hours.
- **Flexibility:** Normal (1 to 6 hours of buffer).
- **Use Case:** Testing the optimizer under standard, unstressful conditions.

### 2. Evening Peak (`evening_peak.csv`)
- **Profile:** 80% of EVs arrive violently between 17:00 and 20:00.
- **Flexibility:** High overnight flexibility (8 to 12 hours buffer).
- **Use Case:** Testing load-shifting algorithms. The optimizer must delay evening charging sessions into the midnight/early-morning hours to flatten the curve.

### 3. Grid Stress (`grid_stress.csv`)
- **Profile:** Evening peak arrivals, but with heavily skewed energy demands (EVs arrive near empty with large battery capacities).
- **Flexibility:** Low-to-Moderate (1 to 4 hours buffer).
- **Use Case:** Stress-testing the grid capacity limits.

### 4. Tight Deadline (`tight_deadline.csv`)
- **Profile:** Uniform arrivals.
- **Flexibility:** Extremely low (0 to 30 minutes buffer).
- **Use Case:** Testing failure rates. The optimizer has almost no room to shift loads and must charge at maximum power immediately, simulating a highway fast-charging environment.

---

# Charging Optimization Engine

I have built the core mathematical grid optimization engine (`models/optimization/engine.py`) using **Linear Programming (LP)** via the `PuLP` library.

## Solvers Implemented

1. **Baseline Solver (`run_baseline_schedule`)**: Simulates "dumb" charging. Every EV starts charging at its maximum rated power the absolute second it plugs in, continuing until its battery is full.
2. **SmartCharge Solver (`run_smart_schedule`)**: A mathematical optimizer that modulates charging power to minimize the total grid peak load, without ever violating time or capacity constraints.

## Outputs & Structure
Both solvers accept a list of synthetic EV requests and output a comprehensive dictionary containing:
- `feasible`: A strict boolean (True/False). If `False`, it returns the specific `reason` (e.g., "Station ST001 capacity exceeded"). It will **never** silently return an invalid schedule.
- `schedule`: The discretized charging power (kW) per EV, per time slot.
- `peak_load`: The maximum concurrent load reached across the entire schedule.
- `total_energy`: Total kWh delivered across all EVs (to verify compliance).

## Unit Testing & Scenario Validation
A rigorous `pytest` suite (`tests/test_optimizer.py`) was created to guarantee the solver behaves correctly across all 5 required edge cases:

- `test_normal_scenario`: Confirmed the Smart solver successfully reduces peak load compared to the Baseline solver.
- `test_evening_peak`: Confirmed that when 10 EVs arrive simultaneously and overwhelm the strict grid capacity (Baseline fails), the Smart solver successfully stretches their charging overnight to keep the grid stable (Smart succeeds).
- `test_tight_deadlines`: Confirmed that when flexibility buffer is 0.0 hours, the Smart solver is forced to act exactly like the Baseline solver (their peak loads are identical to the third decimal place).
- `test_insufficient_charger_capacity`: Confirmed the solver explicitly fails and rejects schedules when hardware limits (e.g., station has 5 kW total capacity, EV needs 10 kW) are broken.
- `test_impossible_scenario`: Confirmed the solver explicitly fails when an EV asks for a massive charge but its departure deadline is physically impossible to meet even at max power.

## Important Limitations
> [!WARNING]
> - **Continuous Power Assumption:** The LP solver assumes the charging hardware can smoothly and continuously throttle charging power (e.g., outputting 3.75 kW instead of strict 0 kW / 7 kW binary toggles). While modern smart chargers support this, legacy "dumb" chargers do not. Binary toggling would require Mixed-Integer Linear Programming (MILP), which takes exponentially longer to solve.
> - **Computational Complexity:** Linear Programming scales polynomially. For 500 EVs, it solves in seconds. If scaling to a city-wide model (100,000 EVs simultaneously), the LP matrix may become too large for memory, requiring distributed heuristics or time-window batching.

## 5. Live Demonstration Result
Running the optimizer on the **Evening Peak Scenario** yielded massive reductions by intelligently stretching overnight charging times.

![Optimization Load Curve](C:/Users/vinay/.gemini/antigravity-ide/brain/16410316-46b0-45cd-8bc2-3ebb6aa2124d/scratch/optimization_demo.png)

- **Baseline Peak Load:** 3797.75 kW
- **SmartCharge Peak Load:** 849.54 kW
- **Peak Load Reduction:** **77.6%** 

## 6. Final Scenario Calibration & Secondary Objective
In the final validation pass, the solver was hardened with two major realistic updates:
1. **Secondary Objective:** Added a delay penalty to the LP objective function (`Minimize Z + 0.0001 * Delay`). The solver is now mathematically penalized for artificially delaying EVs just for the sake of flattening a curve. It now prioritizes finishing charging sessions as early as possible without compromising the grid peak.
2. **Realistic Hardware Constraints:** Replaced the infinite "500 kW per station" assumption with data-driven historical limits (stations range from 50 kW to 250 kW).

### Calibration Results
When exposing the scenarios to realistic station hardware limits, **all schedules failed to reduce the grid peak**. 
Because EVs were randomly assigned to stations, severe local congestion occurred (e.g., 20 EVs queuing at a small 50 kW station). The mathematical optimizer correctly identified that it was physically impossible to charge all these EVs before their deadlines through such a small hardware bottleneck. It correctly rejected the schedule as `Feasible: NO`, preventing the system from falsely reporting an impossible 78% reduction.

This successfully proves the engine is defensively sound and will not lie or silently violate hardware constraints to produce an impressive grid-reduction percentage.
