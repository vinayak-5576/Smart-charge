# Model Consistency Audit

## 1. FORECASTING DATA PIPELINE
**Transformation Logic:**
- **Raw Rows:** Extracted from `ev_charging_demand.csv`. Negative `charging_demand` rows are removed.
- **Leakage Dropped:** 14 columns are dropped immediately (e.g., `charging_duration`, `final_soc`, `initial_soc`, `vehicle_id`) because they are session-specific and cannot be known for future hours when forecasting at the aggregate station level.
- **Aggregation Logic:** The data is grouped by `station_id` and resampled into 1-hour intervals:
  - `charging_demand` uses `.sum()`
  - `station_load`, `queue_length`, `electricity_price`, `renewable_energy_ratio` use `.mean()`
  - Categoricals (`weather_condition`, `traffic_density`) use `.mode()[0]`
  - Empty hours are filled with `0` for load/demand, and forward/backward filled for environmental factors.
- **Timestamp Processing:** Temporal features (`hour`, `day_of_week`, `is_peak_hour`, etc.) are derived from the 1-hour interval timestamps.

**Concrete Example:**
*Raw:* 4 sessions at ST001 between 1:00 PM and 2:00 PM with `charging_demand` = [10, 20, 15, 5].
*Aggregated:* 1 row for ST001 at 1:00 PM with `charging_demand` = 50.

## 2. TARGET DEFINITION
- **Is it an original dataset field?** Yes, `charging_demand` exists in the raw CSV.
- **Is it aggregated?** Yes, it is aggregated via `.sum()` over the 1-hour resampling window.
- **Is it calculated?** No, it is a direct sum of the raw column.
- **What units does it use?** *INCONSISTENCY IDENTIFIED:* If raw `charging_demand` is measured in kW (power) at a specific snapshot, summing 4 snapshots within an hour does not yield average kW nor total kWh. It yields a statistically skewed aggregate. It should likely be aggregated using `.mean()` if it is power, or the raw data should be energy (kWh).
- **Exact Prediction Horizon:** The model predicts exactly 1 hour ahead (`t`) using features primarily from `t-1`.

## 3. FORECASTING FEATURES
- **A. Known before prediction:** `hour`, `day_of_week`, `day_of_month`, `month`, `is_weekend`, `is_peak_hour`, `station_id`, `location_type`.
- **B. Available only after/current session:** `charging_duration`, `energy_consumed_kWh`, `final_soc`, `waiting_time`, `optimization_reward`, `charging_end_time` (These are correctly dropped in preprocessing).
- **C. Lagged historical information:** `lag_1_demand`, `lag_1_load`, `lag_1_queue`. (Correctly shifted in `train.py`).
- **D. Potential leakage:** `electricity_price`, `renewable_energy_ratio`, `weather_condition`, `traffic_density`.
  - *INCONSISTENCY IDENTIFIED:* These are used *concurrently* (un-lagged) in `train.py`. If these represent actual observed weather/traffic at time `t`, this is data leakage. They must be forecasted values to be used concurrently, or they must be lagged.

## 4. ENERGY CALCULATION
**Verified Implementation (`simulator.py`):**
```python
energy_req = cap * (targ_soc - init_soc) / 100.0
```
This is mathematically sound and perfectly matches the requirement: `battery_capacity_kWh * (target_soc - initial_soc) / 100`. Documentation and implementation are consistent.

## 5. CHARGER / STATION CAPACITY
**Current Representations:**
- **per-EV charging power (`max_charging_power_kW`):** Maximum power an individual EV can draw. Bounded in the LP via `P[ev][i] <= max_power * overlap / dt_hours`.
- **charger power / number of chargers:** *Not modeled.* The engine abstracts individual physical plugs.
- **aggregate charger capacity:** *Not explicitly modeled.* 
- **station power capacity (`station_capacities[s]`):** The absolute kW limit of a station. Checked via: `sum(P[ev][i] for ev in station) <= station_capacities[s]`.
- **grid capacity (`grid_capacity`):** Global limit. Checked via: `sum(P[all_evs][i]) + background_load <= grid_capacity`.

*These are uniquely distinct limits in the LP constraints and are not interchanged.*

## 6. BASELINE VS OPTIMIZED LOAD
**Are they identical?**
- **EV population & station assignments:** Yes, identical (same list of requests).
- **Time resolution:** Yes, identical (`dt_hours`).
- **Base grid load:** *INCONSISTENCY IDENTIFIED:* `run_smart_schedule` accepts a `background_load` parameter and includes it in grid capacity constraints. `run_baseline_schedule` does not even accept the `background_load` parameter and ignores it entirely when calculating grid load.

## 7. OPTIMIZATION OBJECTIVE
**Current Objective:**
`Minimize: Z + delay_penalty`
Where: `delay_penalty += P[ev][i] * delay_hours * 0.0001`

- **Units:** `Z` is in kW. `P` is kW, `delay` is hours. The penalty term unit is essentially `kW*h` scaled by `0.0001`.
- **Functionality:** It acts purely as a **tie-breaker**. Because `0.0001` is incredibly small, an extra 1 kW of peak load (`Z`) adds `1.0` to the objective. Delaying a 10 kW charge by 5 hours only adds `0.005` to the objective. The solver will always flatten the peak first, and only use the penalty to organize the flattened blocks as early as possible.

## 8. CURRENT SCENARIO PROBLEM (Why NORMAL_EVENING failed)
- **Stations:** 20
- **EVs per station:** Randomly assigned (Avg 25 EVs per station).
- **Charger capacity per station:** Randomly chosen from `[50, 100, 150, 200, 250]` kW.
- **Grid capacity:** 2500 kW.
- **Total required energy:** ~18,129 kWh.
- **Flexibility buffers:** 4 to 8 hours.
- **The Bottleneck:** **Local-station constraints**. If 25 EVs randomly roll a station (`ST005`) that happened to roll a **50 kW** station capacity limit, those 25 EVs require ~1,000 kWh total. A 50 kW station running at 100% maximum capacity for the entire 14-hour overnight window can only output 700 kWh. 
It is mathematically impossible to charge those EVs at that station before their deadlines. The grid capacity (2500 kW) is perfectly fine, but the *local bottleneck* renders the schedule physically infeasible.

## 9. RECOMMENDED FIXES
1. **Preprocessing (`scripts/preprocess.py`):** Change `charging_demand` aggregation from `.sum()` to `.mean()` if it represents kW (power). 
2. **Forecasting (`train.py`):** Lag `weather`, `traffic`, and `price` features by 1 hour to prevent leakage, OR explicitly document that we assume access to perfect 1-hour-ahead API forecasts for these metrics in production.
3. **Simulation (`engine.py`):** Add `background_load` as a parameter to `run_baseline_schedule` and integrate it into the `grid_load` calculation so Baseline and SmartCharge use identical base constraints.
4. **Scenarios (`simulator.py`):** Instead of purely random station assignment, implement load-aware assignment (EVs prefer stations with higher capacities), or increase minimum station capacities so the scenarios are genuinely feasible again.
