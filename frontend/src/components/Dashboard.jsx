import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart, 
  ReferenceLine 
} from 'recharts';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  Zap, 
  Cpu, 
  BatteryCharging, 
  ArrowRight,
  TrendingDown,
  Clock
} from 'lucide-react';

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
    return (
      <div className="loader-box">
        <div className="cockpit-loader"></div>
        <div>CALIBRATING GRID TELEMETRY...</div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="cockpit-panel" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: 'var(--critical-color)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
          OFFLINE // TELEMETRY CONNECTION REFUSED
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Verify the SmartCharge Python backend service is active on port 8000.
        </div>
      </div>
    );
  }

  const capacity = forecast.grid_capacity || 2500;
  const currentPeak = simulationData ? simulationData.optimized_peak : forecast.peak_kW;
  const headroom = Math.max(0, capacity - currentPeak);
  const congestionRatio = currentPeak / capacity;

  let congestionStatus = "SAFE";
  let statusClass = "safe";
  let StatusIcon = ShieldCheck;

  if (congestionRatio > 0.95) {
    congestionStatus = "CRITICAL";
    statusClass = "critical";
    StatusIcon = ShieldAlert;
  } else if (congestionRatio > 0.8) {
    congestionStatus = "WARNING";
    statusClass = "warning";
    StatusIcon = AlertTriangle;
  }

  const avgLoad = forecast.time_series && forecast.time_series.length > 0
    ? (forecast.time_series.reduce((a, b) => a + b, 0) / forecast.time_series.length).toFixed(1)
    : (currentPeak * 0.68).toFixed(1);

  // Chart data formatting
  const chartData = forecast.time_series ? forecast.time_series.map((val, i) => ({
    time: `T+${(i * 0.5).toFixed(1)}h`,
    demand: Number(val.toFixed(1)),
    capacity: capacity
  })) : [];

  // Custom Automotive Dark Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const loadVal = payload[0].value;
      const margin = capacity - loadVal;
      return (
        <div style={{
          background: '#090d14',
          border: '1px solid var(--panel-border-bright)',
          padding: '10px 14px',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '4px' }}>
            INTERVAL: {label}
          </div>
          <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}>
            DEMAND: <span style={{ color: 'var(--accent-mint)' }}>{loadVal.toLocaleString()} kW</span>
          </div>
          <div style={{ color: margin >= 0 ? 'var(--text-secondary)' : 'var(--critical-color)', fontSize: '0.75rem' }}>
            {margin >= 0 ? `HEADROOM: +${margin.toFixed(1)} kW` : `OVERLOAD: ${margin.toFixed(1)} kW`}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Cockpit Instrument Cluster: Top 3 Main Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '1px', background: 'var(--panel-border)', border: '1px solid var(--panel-border)', borderRadius: '6px', overflow: 'hidden' }}>
        
        {/* Left Section: Navigation & Congestion Status */}
        <div style={{ background: 'var(--bg-surface)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="micro-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span>SYSTEM DISPATCH</span>
              <span className={`status-pill ${statusClass}`}>
                <StatusIcon size={12} />
                {congestionStatus}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
              <span className="numeric-value" style={{ fontSize: '2.6rem' }}>
                {(congestionRatio * 100).toFixed(0)}
              </span>
              <span className="kpi-unit" style={{ fontSize: '1.2rem', marginLeft: 0 }}>%</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginLeft: 'auto' }}>
                Load / Capacity
              </span>
            </div>

            {/* Load bar */}
            <div className="load-progress-track" style={{ marginBottom: '16px' }}>
              <div 
                className="load-progress-fill" 
                style={{ 
                  width: `${Math.min(100, congestionRatio * 100)}%`,
                  background: congestionRatio > 0.95 ? 'var(--critical-color)' : congestionRatio > 0.8 ? 'var(--warning-color)' : 'var(--accent-mint)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--panel-border-subtle)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            <div>
              <span className="micro-label" style={{ display: 'block' }}>GRID FREQUENCY</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>50.02 Hz</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="micro-label" style={{ display: 'block' }}>HEADROOM</span>
              <span style={{ color: 'var(--accent-mint)', fontWeight: 600 }}>+{headroom.toFixed(0)} kW</span>
            </div>
          </div>
        </div>

        {/* Center Section: Primary Speedometer / Load Gauge */}
        <div style={{ background: 'var(--bg-surface)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="status-indicator-dot"></span>
            <span className="micro-label" style={{ color: '#fff', letterSpacing: '0.14em' }}>
              CURRENT PEAK LOAD
            </span>
          </div>

          {/* Central Circular Gauge Aesthetic */}
          <div style={{
            position: 'relative',
            width: '210px',
            height: '130px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px 0'
          }}>
            <div className="numeric-value" style={{ fontSize: '3.4rem', lineHeight: '1', color: '#ffffff' }}>
              {currentPeak.toFixed(0)}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.08em', marginTop: '4px' }}>
              KILOWATTS (kW)
            </div>

            {/* Automotive Limit Pill (similar to red speed limit badge in AERA) */}
            <div style={{
              marginTop: '10px',
              border: '1.5px solid var(--critical-color)',
              borderRadius: '999px',
              padding: '2px 10px',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: '#fff',
              background: 'rgba(239, 68, 68, 0.08)'
            }}>
              CEILING {capacity} kW
            </div>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
            {simulationData ? "OPTIMIZED VIA LINEAR WATER-FILLING" : "BASELINE FORECAST (UNMANAGED)"}
          </div>
        </div>

        {/* Right Section: Power Distribution & Active EV Fleet */}
        <div style={{ background: 'var(--bg-surface)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="micro-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span>FLEET & POWER FLOW</span>
              <Zap size={13} color="var(--accent-mint)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <span className="numeric-value" style={{ fontSize: '2rem' }}>
                  {simulationData ? simulationData.ev_requests : 42}
                </span>
                <span className="kpi-unit">EVs</span>
                <div className="micro-label" style={{ marginTop: '2px' }}>CONNECTED FLEET</div>
              </div>
              <div>
                <span className="numeric-value" style={{ fontSize: '2rem' }}>
                  {capacity}
                </span>
                <span className="kpi-unit">kW</span>
                <div className="micro-label" style={{ marginTop: '2px' }}>SUBSTATION LIMIT</div>
              </div>
            </div>

            {/* AERA-style Power Flow Diagram: [GRID] -> [STATIONS] -> [BATTERIES] */}
            <div style={{
              background: '#0a0e16',
              border: '1px solid var(--panel-border)',
              borderRadius: '4px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={12} color="var(--text-secondary)" />
                <span>GRID</span>
              </div>
              <div style={{ height: '1px', flex: 1, margin: '0 8px', background: 'var(--accent-mint)', opacity: 0.6 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-mint)' }}>
                <Zap size={12} />
                <span>CHARGERS</span>
              </div>
              <div style={{ height: '1px', flex: 1, margin: '0 8px', background: 'var(--accent-mint)', opacity: 0.6 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BatteryCharging size={12} color="var(--text-secondary)" />
                <span>EVs</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--panel-border-subtle)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            <div>
              <span className="micro-label" style={{ display: 'block' }}>AVG HOURLY LOAD</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{avgLoad} kW</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="micro-label" style={{ display: 'block' }}>DISPATCH MODE</span>
              <span style={{ color: 'var(--accent-mint)', fontWeight: 600 }}>WATER-FILLING</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Telemetry Chart: 48-Hour Demand Forecast */}
      <div className="cockpit-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Activity size={14} color="var(--accent-mint)" />
            <span className="panel-title-text">48-Hour Demand Telemetry & Grid Capacity</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '2px', background: 'var(--accent-mint)', display: 'inline-block' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Forecasted Demand</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '1px', borderTop: '2px dashed var(--critical-color)', display: 'inline-block' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Substation Limit ({capacity} kW)</span>
            </div>
          </div>
        </div>

        <div style={{ height: '360px', width: '100%', marginTop: '10px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="aeraForecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5a0" stopOpacity={0.25}/>
                  <stop offset="100%" stopColor="#00e5a0" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#525b6a" 
                tick={{ fill: '#717b8c', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                minTickGap={45} 
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.07)' }}
              />
              <YAxis 
                stroke="#525b6a" 
                tick={{ fill: '#717b8c', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={false}
                domain={[0, Math.max(capacity * 1.15, currentPeak * 1.15)]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={capacity} 
                stroke="var(--critical-color)" 
                strokeDasharray="4 4" 
                strokeWidth={1.5}
              />
              <Area 
                type="monotone" 
                dataKey="demand" 
                stroke="#00e5a0" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#aeraForecastGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Telemetry Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid var(--panel-border-subtle)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>MODEL: RANDOM_FOREST_V2</span>
            <span>HORIZON: 48 HOURS (96 INTERVALS)</span>
            <span>TIME RESOLUTION: 30 MIN</span>
          </div>
          <div>
            STATUS: <span style={{ color: 'var(--accent-mint)' }}>NORMAL DISPATCH</span>
          </div>
        </div>
      </div>

    </div>
  );
}
