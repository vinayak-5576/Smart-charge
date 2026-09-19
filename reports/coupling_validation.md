# Forecast ↔ Optimizer Coupling Validation

## 1. Forecast Contribution
In the baseline scenario, the historical dataset generates a forecast representing **background EV demand**:
- **Forecast Peak:** 331 kW (at slot 4)
- **Forecast Average:** 48 kW
- **Optimized Synthetic EV Peak:** 850 kW
- **Total System Peak:** 858 kW (at slot 65)
- **Forecast Contribution at Total System Peak:** 8 kW (1.0%)

**Analysis:** The optimizer is actively routing the synthetic EVs *around* the forecast peak. The total system peak occurs at slot 65, where the forecast background is nearly zero, proving the optimizer successfully avoids charging during the historical peak.

## 2. Grid-Capacity Sensitivity
We tested how the optimizer behaves as grid capacity is tightened around the EV population.

| Capacity (kW) | Opt Peak (kW) | Deadlines Met | Feasible |
|---------------|---------------|---------------|----------|
| 2500          | 858           | 100.0 %       | True     |
| 1500          | 858           | 100.0 %       | True     |
| 1000          | 858           | 100.0 %       | True     |
| 900           | 858           | 100.0 %       | True     |
| 850           | 3806          | 100.0 %       | False    |

**Analysis:** The synthetic fleet has an absolute mathematical minimum peak of ~850 kW required to deliver all requested energy within user deadlines. If the grid capacity falls below this, the LP solver mathematically fails to find a feasible schedule.

## 3. Constrained Forecast Sensitivity
Using a tightly constrained but feasible grid capacity (900 kW), we modified the forecast background load to observe the optimizer's reaction.

| Scenario   | Forecast Peak | Opt System Peak | Peak Reduc | Feasible |
|------------|---------------|-----------------|------------|----------|
| Original   | 331 kW        | 858 kW          | 77.5 %     | True     |
| +20%       | 397 kW        | 860 kW          | 77.4 %     | True     |
| -20%       | 265 kW        | 856 kW          | 77.5 %     | True     |

**Analysis:** The optimizer is genuinely bounded by the background forecast. Increasing the forecast raises the inflexible floor, mathematically forcing the optimized peak to rise from 858 to 860 kW. 

## 4. Double Counting Verification
- **Max absolute error:** 0.00
- **Violating slots:** 0 out of 84
- **Result:** `total_system_load == forecast_background_load + scheduled_synthetic_EV_load` perfectly holds. 

## 5. Integration Classification
**Classification: B. VALID BUT WEAKLY INFLUENTIAL**

**Justification:**
The forecast is structurally and mathematically integrated into the optimizer, operating correctly as an absolute background constraint. There is no double-counting, and the optimizer actively routes around the forecast peaks. 

However, because the synthetic EV simulation was designed as a massive "stress test" (generating 3806 kW of ASAP baseline demand with a hard mathematical minimum of ~850 kW optimized demand), it completely dwarfs the historical dataset's sparse ~331 kW peak scale. 

Therefore, while the integration is 100% valid, the background forecast is *weakly influential* on the final system peak simply because the massive synthetic fleet dominates the total energy profile.
