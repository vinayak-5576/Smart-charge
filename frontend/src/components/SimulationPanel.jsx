import React, { useState } from 'react';
import { api } from '../api/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { 
  Play, 
  CheckCircle2, 
  AlertOctagon, 
  TrendingDown, 
  Sliders, 
  Sun, 
  Car,
  Layers
} from 'lucide-react';

export default function SimulationPanel({ setSimulationData, simulationData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [evGrowth, setEvGrowth] = useState(0);
  const [solarGrowth, setSolarGrowth] = useState(0);
  const [optimizerMode, setOptimizerMode] = useState('COMFORT'); // ECO | COMFORT | AGGRESSIVE

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const bufferMap = {
        'ECO': 5.0,
        'COMFORT': 4.0,
        'AGGRESSIVE': 2.5
      };

      const config = {
        scenario_type: 'mock',
        num_evs: 500,
        flexibility_buffer_hours: bufferMap[optimizerMode] || 4.0,
        grid_capacity: 2500.0,
        num_stations: 20,
        station_capacity: 105.0,
        dt_hours: 0.5,
        forecast_modifier: 0.0,
        ev_growth_percent: evGrowth,
        solar_capacity_modifier: solarGrowth
      };
      const res = await api.simulateWhatIf(config);
      
      if (res.baseline_peak === undefined) {
        throw new Error(res.failure_reason || res.error || "Simulation failed critically on the backend.");
      }
      
      setSimulationData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const base = payload.find(p => p.dataKey === 'Baseline Load')?.value || 0;
      const opt = payload.find(p => p.dataKey === 'SmartCharge Load')?.value || 0;
      const diff = base - opt;
      return (
        <div style={{
          background: '#090d14',
          border: '1px solid var(--panel-border-bright)',
          padding: '10px 14px',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem'
        }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>INTERVAL {label}</div>
          <div style={{ color: '#94a3b8' }}>BASELINE: {base.toFixed(1)} kW</div>
          <div style={{ color: 'var(--accent-mint)', fontWeight: 700 }}>SMARTCHARGE: {opt.toFixed(1)} kW</div>
          <div style={{ color: diff >= 0 ? 'var(--accent-mint)' : 'var(--critical-color)', marginTop: '4px' }}>
            {diff >= 0 ? `PEAK SHAVED: -${diff.toFixed(1)} kW` : `ADDITIONAL: +${Math.abs(diff).toFixed(1)} kW`}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Simulation Control Console */}
      <div className="cockpit-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Sliders size={15} color="var(--accent-mint)" />
            <span className="panel-title-text">Simulation Engine // Stress Test & What-If Sandbox</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Automotive Mode Selector Buttons: ECO / COMFORT / AGGRESSIVE */}
            <div style={{ 
              display: 'flex', 
              background: '#090c12', 
              border: '1px solid var(--panel-border)', 
              borderRadius: '4px', 
              padding: '2px', 
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem'
            }}>
              {['ECO', 'COMFORT', 'AGGRESSIVE'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setOptimizerMode(mode)}
                  style={{
                    background: optimizerMode === mode ? 'var(--accent-mint)' : 'transparent',
                    color: optimizerMode === mode ? '#06080c' : 'var(--text-secondary)',
                    fontWeight: optimizerMode === mode ? 700 : 500,
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                    transition: 'all 0.1s ease'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button 
              className="btn-cockpit primary" 
              onClick={handleRunSimulation} 
              disabled={loading}
              style={{ minWidth: '170px' }}
            >
              {loading ? (
                <div className="cockpit-loader" style={{ width: '14px', height: '14px', borderWidth: '1.5px' }} />
              ) : (
                <Play size={13} />
              )}
              <span>{loading ? 'SOLVING LP...' : 'EXECUTE OPTIMIZER'}</span>
            </button>
          </div>
        </div>

        {/* Dual Telemetry Slider Controllers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '10px' }}>
          
          <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--panel-border-subtle)', borderRadius: '4px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={15} color="var(--accent-cyan)" />
                <span className="micro-label" style={{ color: '#fff' }}>EV FLEET ADOPTION GROWTH</span>
              </div>
              <span className="numeric-value" style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>
                +{evGrowth}%
              </span>
            </div>
            <input 
              type="range" 
              min="0" max="1000" step="50" 
              value={evGrowth} 
              onChange={(e) => setEvGrowth(parseInt(e.target.value))}
              style={{ accentColor: 'var(--accent-cyan)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '8px' }}>
              <span>BASELINE (500 EVs)</span>
              <span>10x FLEET (5,500 EVs)</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--panel-border-subtle)', borderRadius: '4px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sun size={15} color="var(--accent-mint)" />
                <span className="micro-label" style={{ color: '#fff' }}>SOLAR GENERATION OFFSET</span>
              </div>
              <span className="numeric-value" style={{ color: 'var(--accent-mint)', fontSize: '1.1rem' }}>
                +{solarGrowth}%
              </span>
            </div>
            <input 
              type="range" 
              min="0" max="200" step="10" 
              value={solarGrowth} 
              onChange={(e) => setSolarGrowth(parseInt(e.target.value))}
              style={{ accentColor: 'var(--accent-mint)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '8px' }}>
              <span>GRID COMMITTED</span>
              <span>+200% MIDDAY PEAK</span>
            </div>
          </div>

        </div>
      </div>

      {error && (
        <div className="cockpit-panel" style={{ borderColor: 'var(--critical-border)', background: 'var(--critical-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--critical-color)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
            <AlertOctagon size={16} />
            SOLVER CONFLICT / INFEASIBLE CONSTRAINTS
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: '0.8rem', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
            {error}
          </div>
        </div>
      )}

      {/* Results Cluster */}
      {simulationData && !loading && (
        <>
          <div className="kpi-row">
            <div className="kpi-cell">
              <div className="micro-label">UNMANAGED PEAK</div>
              <div>
                <span className="numeric-value" style={{ color: '#94a3b8' }}>
                  {simulationData.baseline_peak.toFixed(1)}
                </span>
                <span className="kpi-unit">kW</span>
              </div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                DUMB CHARGING SCENARIO
              </div>
            </div>

            <div className="kpi-cell">
              <div className="micro-label">OPTIMIZED PEAK</div>
              <div>
                <span className="numeric-value" style={{ color: 'var(--accent-mint)' }}>
                  {simulationData.optimized_peak.toFixed(1)}
                </span>
                <span className="kpi-unit">kW</span>
              </div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--safe-color)' }}>
                COORDINATED WATER-FILLING
              </div>
            </div>

            <div className="kpi-cell">
              <div className="micro-label">PEAK REDUCTION</div>
              <div>
                <span className="numeric-value" style={{ color: simulationData.peak_reduction > 0 ? 'var(--accent-mint)' : 'var(--critical-color)' }}>
                  {simulationData.peak_reduction > 0 ? `-${simulationData.peak_reduction.toFixed(1)}` : '0.0'}
                </span>
                <span className="kpi-unit">%</span>
              </div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                MAX INFRASTRUCTURE IMPACT
              </div>
            </div>

            <div className="kpi-cell">
              <div className="micro-label">DEADLINE COMPLIANCE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="numeric-value">
                  {simulationData.deadline_compliance.toFixed(1)}
                </span>
                <span className="kpi-unit">%</span>
                <span className={`status-pill ${simulationData.feasible ? 'safe' : 'critical'}`} style={{ marginLeft: 'auto' }}>
                  {simulationData.feasible ? 'FEASIBLE' : 'VIOLATION'}
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {simulationData.constraint_violations} CONSTRAINT VIOLATIONS
              </div>
            </div>
          </div>

          {/* Comparative Dispatch Chart */}
          <div className="cockpit-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Layers size={14} color="var(--accent-mint)" />
                <span className="panel-title-text">Load Shifting Comparison: Unmanaged Baseline vs SmartCharge Dispatch</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', background: '#334155', borderRadius: '2px', display: 'inline-block' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Baseline Load</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', background: 'var(--accent-mint)', borderRadius: '2px', display: 'inline-block' }}></span>
                  <span style={{ color: 'var(--accent-mint)' }}>SmartCharge Dispatched</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '12px', height: '1px', borderTop: '2px dashed var(--critical-color)', display: 'inline-block' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Grid Limit</span>
                </div>
              </div>
            </div>

            <div style={{ height: '360px', width: '100%', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={simulationData.baseline_time_series ? simulationData.baseline_time_series.map((val, i) => ({
                    name: `T+${(i * 0.5).toFixed(1)}h`,
                    'Baseline Load': Number(val.toFixed(1)),
                    'SmartCharge Load': Number(simulationData.optimized_time_series[i].toFixed(1))
                  })) : []}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  barGap={1}
                >
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#525b6a" 
                    tick={{ fill: '#717b8c', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                    minTickGap={45} 
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.07)' }}
                  />
                  <YAxis 
                    stroke="#525b6a" 
                    tick={{ fill: '#717b8c', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <ReferenceLine 
                    y={simulationData.grid_capacity || 2500.0} 
                    stroke="var(--critical-color)" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5} 
                  />
                  <Bar dataKey="Baseline Load" fill="#252f40" radius={[1, 1, 0, 0]} />
                  <Bar dataKey="SmartCharge Load" fill="#00e5a0" radius={[1, 1, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--panel-border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>ALGORITHM: CBC_LP_SOLVER (DETERMINISTIC)</span>
              <span>WATER LEVEL: OPTIMAL</span>
              <span>GRID VIOLATIONS: <strong style={{ color: simulationData.constraint_violations === 0 ? 'var(--accent-mint)' : 'var(--critical-color)' }}>{simulationData.constraint_violations}</strong></span>
            </div>
          </div>
        </>
      )}

      {!simulationData && !loading && !error && (
        <div className="cockpit-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#101622', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Play size={18} color="var(--accent-mint)" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#fff', letterSpacing: '0.08em', marginBottom: '6px' }}>
            SIMULATION READY FOR DISPATCH
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', maxWidth: '420px', margin: '0 auto' }}>
            Adjust parameters above and click "Execute Optimizer" to run the linear programming peak shaving algorithm.
          </p>
        </div>
      )}

    </div>
  );
}
