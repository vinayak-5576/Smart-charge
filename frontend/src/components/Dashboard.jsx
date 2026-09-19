import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ShieldAlert, ShieldCheck, Shield, AlertTriangle, Activity } from 'lucide-react';

export default function Dashboard({ simulationData }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getForecast();
        setForecast(data);
      } catch (e) {
        console.error("Failed to load forecast", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="loader-container"><div className="loader"></div><div>Loading Grid Status...</div></div>;
  }

  if (!forecast) {
    return <div className="glass-panel">Error loading data. Is the backend running?</div>;
  }

  // Calculate congestion status based on forecast peak and dynamic grid capacity
  const capacity = forecast.grid_capacity || 2500;
  const currentPeak = simulationData ? simulationData.optimized_peak : forecast.peak_kW;
  const congestionRatio = currentPeak / capacity;
  
  let congestionStatus = "SAFE";
  let StatusIcon = ShieldCheck;
  let statusClass = "status-safe";
  
  if (congestionRatio > 0.95) {
    congestionStatus = "CRITICAL";
    StatusIcon = ShieldAlert;
    statusClass = "status-critical";
  } else if (congestionRatio > 0.8) {
    congestionStatus = "WARNING";
    StatusIcon = AlertTriangle;
    statusClass = "status-warning";
  }

  // Chart data
  const chartData = forecast.time_series.map((val, i) => {
    return {
      time: `T+${i/2}h`,
      'Forecasted Demand': val,
      'Grid Capacity': capacity
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* KPI Cards */}
      <div className="grid-cols-4">
        <div className="glass-panel kpi-card">
          <div className="kpi-title">Current Peak Load</div>
          <div><span className="kpi-value">{currentPeak.toFixed(1)}</span><span className="kpi-unit">kW</span></div>
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-title">Grid Capacity</div>
          <div><span className="kpi-value">{capacity}</span><span className="kpi-unit">kW</span></div>
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-title">Active EVs</div>
          <div><span className="kpi-value">{simulationData ? simulationData.ev_requests : 0}</span><span className="kpi-unit">EVs</span></div>
        </div>
        <div className="glass-panel kpi-card" style={{ borderLeft: `4px solid var(--${congestionStatus.toLowerCase()}-color)` }}>
          <div className="kpi-title">Congestion Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <span className={`status-badge ${statusClass}`}>
              <StatusIcon size={14} style={{ marginRight: '4px' }}/>
              {congestionStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass-panel">
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={20} color="#3b82f6"/> 48-Hour Demand Forecast
        </h3>
        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCapacity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#94a3b8" minTickGap={30} />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(20, 26, 40, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Legend />
              <Area type="monotone" dataKey="Forecasted Demand" stroke="#3b82f6" fillOpacity={1} fill="url(#colorForecast)" />
              <Line type="monotone" dataKey="Grid Capacity" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
