import pandas as pd
import numpy as np

def analyze_capacities():
    df = pd.read_csv('data/ev_charging_demand.csv')
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Analyze charging_demand units
    max_demand = df['charging_demand'].max()
    print(f"Max charging demand in raw data: {max_demand}")
    
    # Analyze chargers per station
    if 'assigned_charger_id' in df.columns:
        chargers_per_station = df.groupby('station_id')['assigned_charger_id'].nunique()
        print("\nUnique chargers per station:")
        print(chargers_per_station.describe())
        print(chargers_per_station)
    
    # Analyze max concurrent load per station
    # We can infer station capacity by looking at the maximum station_load or charging_demand observed
    # for each station over any 15 minute interval.
    # The dataset already has station_load. Let's see the max per station.
    max_load_per_station = df.groupby('station_id')['station_load'].max()
    print("\nMax station_load observed per station:")
    print(max_load_per_station.describe())
    print(max_load_per_station)
    
    # Analyze max demand per station
    max_demand_per_station = df.groupby('station_id')['charging_demand'].max()
    print("\nMax charging_demand observed per station:")
    print(max_demand_per_station.describe())
    print(max_demand_per_station)
    
    # Analyze station assignment probabilities
    station_counts = df['station_id'].value_counts(normalize=True)
    print("\nHistorical station assignment probabilities:")
    print(station_counts)

if __name__ == '__main__':
    analyze_capacities()
