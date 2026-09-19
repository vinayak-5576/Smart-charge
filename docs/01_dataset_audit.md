# EV Charging Demand - Dataset Audit & Feature Selection

## 1. Dataset Overview
- **Rows:** 8,354
- **Columns:** 27
- **Missing Values:** 0
- **Duplicate Rows:** 0
- **Number of Stations:** 20 unique stations
- **Number of Vehicles:** 8,354 unique vehicles (each row is a unique session)
- **Timestamp Range:** `2025-01-01 00:00:00` to `2025-03-29 00:15:00` (87 days)

## 2. Value Ranges & Distributions
- **`battery_capacity_kWh`**: 30 to 100 kWh
- **`initial_soc`**: 10.0% to 59.99%
- **`final_soc`**: 65.0% to 100.0%
- **`energy_consumed_kWh`**: 7.5 to 89.9 kWh
- **`charging_power_kW`**: 7 kW to 50 kW
- **`queue_length`**: 0 to 15 vehicles
- **`electricity_price`**: $5.0 to $15.0

## 3. Feature & Target Selection
### The Target
- **Selected Target:** `charging_demand`
- **Reason:** The goal is grid load optimization. `charging_demand` directly measures the total load (kW) being pulled from the grid at any given time. `station_load` was highly correlated (0.99) but `charging_demand` acts as a better forward-looking metric.

### Preserved Predictors (No Leakage)
These columns are 100% known at prediction time:
- **Time/Calendar:** `hour`, `day_of_week`, `day_of_month`, `month`, `is_weekend`, `is_peak_hour`
- **Environmental:** `weather_condition`, `traffic_density` (as lags), `electricity_price`, `renewable_energy_ratio`
- **Station Meta:** `station_id`, `location_type`
- **State Lags:** `charging_demand_t-1`, `queue_length_t-1`, `station_load_t-1` (Must be lagged by 1 hour to prevent leakage).

### Excluded Predictors (Data Leakage Risks)
We aggressively dropped the following columns to prevent the model from cheating by looking at the future:
- `charging_start_time` and `charging_end_time` (Unknown until charging actually happens)
- `waiting_time` and `charging_duration` (Unknown at arrival)
- `final_soc` and `energy_consumed_kWh` (Realized at the end of the session)
- `optimization_reward` (Determined post-facto)
