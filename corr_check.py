import pandas as pd
df = pd.read_csv('ev_charging_dataset.csv')
numeric_cols = df.select_dtypes(include=['number']).columns
corr = df[numeric_cols].corr()
print("Correlation with charging_demand:")
print(corr['charging_demand'].sort_values(ascending=False))
print("\nCorrelation with station_load:")
print(corr['station_load'].sort_values(ascending=False))
