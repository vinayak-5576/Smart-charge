# Forecast ↔ Optimizer Semantics

## 1. charging_demand
- **Meaning:** In the dataset and forecasting model, `charging_demand` represents the total observed EV charging power (kW) at a specific station over an hour.
- **Role:** It is the target variable of the Random Forest model, which predicts the *aggregate EV charging demand*.

## 2. background_load
- **Meaning:** In `models/optimization/engine.py`, `background_load` is a time-series vector (at 30-min resolution) representing non-controllable, rigid power draw on the grid.
- **Role:** It is added directly to `grid_load` before the LP solver checks the `grid_capacity` constraint.

## 3. The Double-Counting Problem
If we pass the forecasted `charging_demand` directly into `background_load` and simultaneously generate synthetic EV requests, we will **double-count** the EV demand. 
- The forecast predicts *total EV demand*.
- The synthetic requests represent *simulated EV demand*.
Adding them together assumes they are independent, which is false—they represent the same physical phenomenon.

## 4. Design for Correct Integration
To avoid double-counting while preserving the mathematical integrity of the system, we define a **Controlled vs. Uncontrolled Partition**:

1. **Forecasted Total Load `F(t)`:** The prediction output representing all expected EV demand (both flexible and inflexible).
2. **Synthetic Baseline Load `B(t)`:** The natural (ASAP) power draw of the synthetic EV requests we generate. These represent the subset of users who opted into the SmartCharge program.
3. **Inflexible Background Load `U(t)`:** The remaining, unmanaged power draw from EVs that cannot be shifted.
   - Formula: `U(t) = max(0, F(t) - B(t))`

We will pass `U(t)` to the optimizer as `background_load`. The optimizer will then shift the flexible synthetic EVs `S(t)` around this rigid background profile. The final optimized grid load will be `U(t) + S(t)`.

## 5. Time Alignment
- The forecast operates on **1-hour intervals**.
- The optimizer operates on **0.5-hour intervals**.
- **Conversion Method:** Forward fill (step interpolation). A forecasted demand of `100 kW` for `08:00 - 09:00` will be applied as `100 kW` for `08:00 - 08:30` and `100 kW` for `08:30 - 09:00`. This is mathematically robust because power (kW) is an instantaneous rate; a constant power over 1 hour delivers the exact predicted energy (kWh) when duplicated across two half-hour slots.
