import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
import numpy as np

def run_eda(input_csv, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    df = pd.read_csv(input_csv)
    
    # 1. Charging demand by hour (mean + CI)
    plt.figure(figsize=(10,5))
    sns.lineplot(data=df, x='hour', y='charging_demand', marker='o')
    plt.title('Average Charging Demand by Hour of Day')
    plt.grid(True, alpha=0.3)
    plt.savefig(os.path.join(out_dir, 'demand_by_hour.png'), bbox_inches='tight')
    plt.close()
    
    # 2. Charging demand by day of week
    plt.figure(figsize=(10,5))
    sns.barplot(data=df, x='day_of_week', y='charging_demand')
    plt.title('Average Charging Demand by Day of Week (0=Mon, 6=Sun)')
    plt.savefig(os.path.join(out_dir, 'demand_by_dow.png'), bbox_inches='tight')
    plt.close()
    
    # 3. Charging demand by station
    plt.figure(figsize=(12,6))
    sns.barplot(data=df, x='station_id', y='charging_demand')
    plt.title('Average Charging Demand by Station')
    plt.xticks(rotation=45)
    plt.savefig(os.path.join(out_dir, 'demand_by_station.png'), bbox_inches='tight')
    plt.close()
    
    # 4. Station utilization distribution (station_load)
    plt.figure(figsize=(10,5))
    sns.histplot(df[df['station_load'] > 0]['station_load'], bins=50, kde=True)
    plt.title('Station Load Distribution (Excluding Zero-Demand Hours)')
    plt.savefig(os.path.join(out_dir, 'utilization_dist.png'), bbox_inches='tight')
    plt.close()
    
    # 5. Queue length vs charging demand
    plt.figure(figsize=(10,5))
    # Round queue length to nearest integer for cleaner grouping
    df['queue_rounded'] = df['queue_length'].round()
    sns.barplot(data=df, x='queue_rounded', y='charging_demand')
    plt.title('Average Charging Demand by Queue Length')
    plt.savefig(os.path.join(out_dir, 'queue_vs_demand.png'), bbox_inches='tight')
    plt.close()
    
    # 6. Charging demand during peak vs off-peak
    plt.figure(figsize=(8,5))
    sns.barplot(data=df, x='is_peak_hour', y='charging_demand')
    plt.title('Demand: Off-Peak (0) vs Peak (1)')
    plt.savefig(os.path.join(out_dir, 'peak_vs_offpeak.png'), bbox_inches='tight')
    plt.close()
    
    # 7. Charging demand by location type
    loc_cols = [c for c in df.columns if c.startswith('location_type_')]
    if loc_cols:
        loc_means = {c.replace('location_type_', ''): df[df[c] == 1]['charging_demand'].mean() for c in loc_cols}
        plt.figure(figsize=(8,5))
        plt.bar(loc_means.keys(), loc_means.values(), color=['skyblue', 'salmon'])
        plt.title('Mean Demand by Location Type')
        plt.ylabel('Average Charging Demand')
        plt.savefig(os.path.join(out_dir, 'demand_by_location.png'), bbox_inches='tight')
        plt.close()
        
    # 8. Weather & Traffic Patterns
    weather_cols = [c for c in df.columns if c.startswith('weather_condition_')]
    if weather_cols:
        weather_means = {c.replace('weather_condition_', ''): df[df[c] == 1]['charging_demand'].mean() for c in weather_cols}
        plt.figure(figsize=(8,5))
        plt.bar(weather_means.keys(), weather_means.values(), color='lightgreen')
        plt.title('Mean Demand by Weather Condition')
        plt.savefig(os.path.join(out_dir, 'demand_by_weather.png'), bbox_inches='tight')
        plt.close()
        
    traffic_cols = [c for c in df.columns if c.startswith('traffic_density_')]
    if traffic_cols:
        traffic_means = {c.replace('traffic_density_', ''): df[df[c] == 1]['charging_demand'].mean() for c in traffic_cols}
        plt.figure(figsize=(8,5))
        plt.bar(traffic_means.keys(), traffic_means.values(), color='orange')
        plt.title('Mean Demand by Traffic Density')
        plt.savefig(os.path.join(out_dir, 'demand_by_traffic.png'), bbox_inches='tight')
        plt.close()
        
    # Also save correlations to print
    numeric_df = df.select_dtypes(include=[np.number])
    corr = numeric_df.corr()['charging_demand'].sort_values(ascending=False)
    with open(os.path.join(out_dir, 'correlations.txt'), 'w') as f:
        f.write(corr.to_string())

if __name__ == '__main__':
    run_eda('data/processed/forecasting_data.csv', r'C:\Users\vinay\.gemini\antigravity-ide\brain\16410316-46b0-45cd-8bc2-3ebb6aa2124d\scratch')
