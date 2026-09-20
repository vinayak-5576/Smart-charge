import datetime
import random

def create_mock_requests(num, flexibility_buffer_hours, same_station=False):
    requests = []
    base_time = datetime.datetime(2025, 4, 1, 10, 0, 0)

    for i in range(num):
        arrival = base_time + datetime.timedelta(minutes=3 * i)
        power = 10.0
        energy = 20.0
        min_time = energy / power
        deadline = arrival + datetime.timedelta(
            hours=min_time + flexibility_buffer_hours
        )

        requests.append({
            'ev_id': f'EV_{i}',
            'station_id': 'ST001' if same_station else f'ST{str(i % 5).zfill(3)}',
            'arrival_time': arrival.strftime('%Y-%m-%d %H:%M:%S'),
            'departure_deadline': deadline.strftime('%Y-%m-%d %H:%M:%S'),
            'energy_required_kWh': energy,
            'max_charging_power_kW': power,
            'initial_soc': round(random.uniform(0.1, 0.8), 2)
        })

    return requests