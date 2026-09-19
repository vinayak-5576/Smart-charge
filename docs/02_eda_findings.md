# Exploratory Data Analysis (EDA) Findings

The EDA phase uncovered several critical insights regarding how charging demand fluctuates, which heavily influenced the forecasting model architecture.

## 1. Charging Demand Patterns
- **Hourly (Diurnal) Pattern:** There is a strong cyclical diurnal pattern. Demand is significantly higher during the predefined "Peak" hours (17:00-21:00) compared to off-peak hours.
- **Day of Week:** Surprisingly weak variance between days. The demand remains relatively flat across weekdays vs weekends at a global level, indicating that commuter patterns and weekend travel balance each other out in the aggregate.
- **Queue Length:** There is a strong linear correlation (`0.71`) between the number of vehicles in the queue and the current demand.

## 2. Station Behavior
- **Geographic Imbalance:** Some of the 20 stations consistently pull vastly more demand than others.
- **Location Type:** Urban stations show distinctly different baseline volumes compared to Highway stations. 
- **Utilization Distribution:** When active, most stations hover around 50% utilization, but the vast majority of hours in the dataset actually contain exactly `0` demand (highly sparse data).

## 3. Weather & Traffic Patterns
- **Environmental Impact:** While physically intuitive, global linear correlations for weather, traffic, and electricity price were near zero (`< 0.05`). 
- **Conclusion for Modeling:** Simple linear models will fail to capture value from weather/traffic. Complex interaction effects (e.g., Heavy Rain + Urban Highway) require an advanced, non-linear ML model (like Random Forest) to decode.

## 4. Key Charts Reported (Available in Artifacts)
- `demand_by_hour.png`
- `demand_by_dow.png`
- `demand_by_station.png`
- `utilization_dist.png`
- `queue_vs_demand.png`
- `peak_vs_offpeak.png`
