import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
from sklearn.metrics import mean_absolute_error, mean_squared_error
import os

def mean_absolute_percentage_error(y_true, y_pred):
    # Mask zeros to avoid infinity
    mask = y_true != 0
    if mask.sum() == 0:
        return np.nan
    return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100

def main():
    print("Loading test data and model...")
    test_df = pd.read_csv('models/forecasting/test_data.csv')
    test_df['timestamp'] = pd.to_datetime(test_df['timestamp'])
    
    model = joblib.load('models/forecasting/rf_model.pkl')
    features = joblib.load('models/forecasting/features.pkl')
    
    X_test = test_df[features]
    y_test = test_df['charging_demand']
    
    print("Predicting...")
    # 1. Naive baseline: tomorrow's demand is today's demand at the same hour
    # Our lag_1_demand is actually t-1 hour demand, which is a common naive baseline.
    y_pred_naive = test_df['lag_1_demand']
    
    # 2. ML Prediction
    y_pred_ml = model.predict(X_test)
    
    test_df['pred_ml'] = y_pred_ml
    test_df['pred_naive'] = y_pred_naive
    
    # Calculate metrics
    mae_naive = mean_absolute_error(y_test, y_pred_naive)
    rmse_naive = np.sqrt(mean_squared_error(y_test, y_pred_naive))
    mape_naive = mean_absolute_percentage_error(y_test, y_pred_naive)
    
    mae_ml = mean_absolute_error(y_test, y_pred_ml)
    rmse_ml = np.sqrt(mean_squared_error(y_test, y_pred_ml))
    mape_ml = mean_absolute_percentage_error(y_test, y_pred_ml)
    
    print("\n--- Model Evaluation Results ---")
    print(f"Naive Baseline:")
    print(f"  MAE:  {mae_naive:.4f}")
    print(f"  RMSE: {rmse_naive:.4f}")
    print(f"  MAPE: {mape_naive:.2f}%")
    print("-" * 30)
    print(f"Random Forest ML:")
    print(f"  MAE:  {mae_ml:.4f}")
    print(f"  RMSE: {rmse_ml:.4f}")
    print(f"  MAPE: {mape_ml:.2f}%")
    print("-" * 30)
    
    # Visualization: Pick one station and plot a subset of days (e.g., 3 days)
    sample_station = test_df['station_id'].iloc[0]
    plot_df = test_df[test_df['station_id'] == sample_station].head(72) # 3 days (24*3)
    
    plt.figure(figsize=(14,6))
    plt.plot(plot_df['timestamp'], plot_df['charging_demand'], label='Actual Demand', color='black', linewidth=2)
    plt.plot(plot_df['timestamp'], plot_df['pred_naive'], label='Naive Baseline (t-1)', color='red', linestyle='--', alpha=0.7)
    plt.plot(plot_df['timestamp'], plot_df['pred_ml'], label='RF Model Forecast', color='blue', linewidth=2, alpha=0.8)
    
    plt.title(f'Demand Forecast vs Actual (Station: {sample_station})')
    plt.xlabel('Time')
    plt.ylabel('Charging Demand')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    out_dir = r'C:\Users\vinay\.gemini\antigravity-ide\brain\16410316-46b0-45cd-8bc2-3ebb6aa2124d\scratch'
    os.makedirs(out_dir, exist_ok=True)
    plot_path = os.path.join(out_dir, 'actual_vs_predicted.png')
    plt.savefig(plot_path, bbox_inches='tight')
    plt.close()
    
    print(f"Saved visualization to {plot_path}")

if __name__ == '__main__':
    main()
