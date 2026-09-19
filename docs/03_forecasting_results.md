# Forecasting Results

The forecasting module's objective was to predict the hourly `charging_demand` for each station using strictly non-leaky, available-at-time-t features.

## 1. Train / Validation Setup
Because this is time-series data, **random shuffling was strictly prohibited**. 
- The dataset was sorted chronologically.
- The first 80% of the timeline was used as the **Training Set**.
- The final 20% was reserved as the **Validation/Test Set** to simulate real-world future prediction.
- All target state variables (`demand`, `load`, `queue`) were lagged by exactly 1 hour (`t-1`).

## 2. Model Performance

We compared a Machine Learning model against a naive "Persistence" baseline (which assumes the next hour's demand will exactly match the previous hour).

### Baseline Model (Naive Persistence)
- **MAE:** 18.42 kW
- **RMSE:** 37.14
- **MAPE:** 91.28%

### Final ML Model (Random Forest Regressor)
- **MAE:** 10.59 kW
- **RMSE:** 20.29
- **MAPE:** 49.45%

## 3. Final Chosen Model: Random Forest
- **Why it was chosen:** The Random Forest Regressor effectively cut the prediction error in half compared to the baseline. It natively handles the non-linear interactions between temporal features (`hour`, `is_peak`), spatial constraints (`station_id`), and environmental factors without requiring deep feature scaling or complex neural network architectures.
- **Limitations Identified:** Due to the sparsity of station-level demand, there are many hours with exactly `0` demand. Tree-based regressors often predict fractional values (e.g., `0.5 kW`) instead of hard zeroes, which artificially inflates the MAPE metric. A future two-stage hurdle model (Classification -> Regression) could improve this.
