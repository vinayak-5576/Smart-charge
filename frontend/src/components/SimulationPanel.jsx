import React, { useState } from 'react';
import { api } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Zap, Play, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function SimulationPanel({ setSimulationData, simulationData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [evGrowth, setEvGrowth] = useState(0);
  const [solarGrowth, setSolarGrowth] = useState(0);

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = {
        scenario_type: 'mock',
        num_evs: 500,
        flexibility_buffer_hours: 4.0,
        grid_capacity: 2500.0,
        num_stations: 20,
        station_capacity: 105.0,
        dt_hours: 0.5,
        forecast_modifier: 0.0,
        ev_growth_percent: evGrowth,
        solar_capacity_modifier: solarGrowth
      };
      const res = await api.simulateWhatIf(config);
      
      // If the backend threw an exception during core_sim, it returns an error object without peaks
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Control Panel */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>What-If Scenario Planning</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Simulate future infrastructure impacts using the upgraded Optimization Engine (Phase 2 & 3).</p>
          </div>
          <button className="btn btn-primary" onClick={handleRunSimulation} disabled={loading}>
            {loading ? <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}/> : <Play size={18} />}
            {loading ? 'Calculating Safe Schedule...' : 'RUN SIMULATION'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>EV Adoption Growth</span>
              <span style={{ color: 'var(--brand-color)' }}>+{evGrowth}%</span>
            </label>
            <input 
              type="range" 
              min="0" max="200" step="10" 
              value={evGrowth} 
              onChange={(e) => setEvGrowth(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--brand-color)' }}
            />
            <small style={{ color: 'var(--text-secondary)' }}>Increase the baseline number of EVs (Stress Test)</small>
          </div>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Renewable Solar Additions</span>
              <span style={{ color: 'var(--safe-color)' }}>+{solarGrowth}%</span>
            </label>
            <input 
              type="range" 
              min="0" max="200" step="10" 
              value={solarGrowth} 
              onChange={(e) => setSolarGrowth(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--safe-color)' }}
            />
            <small style={{ color: 'var(--text-secondary)' }}>Increase solar energy availability during midday (Cost Reduction)</small>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--critical-color)' }}>
          <h3 style={{ color: 'var(--critical-color)', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertOctagon size={20}/> Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {simulationData && !loading && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Summary KPIs */}
          <div className="grid-cols-3">
            <div className="glass-panel kpi-card">
              <div className="kpi-title">Unmanaged Peak</div>
              <div><span className="kpi-value">{simulationData.baseline_peak.toFixed(1)}</span><span className="kpi-unit">kW</span></div>
            </div>
            <div className="glass-panel kpi-card" style={{ background: 'var(--safe-bg)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div className="kpi-title" style={{ color: 'var(--safe-color)' }}>Optimized Peak</div>
              <div><span className="kpi-value" style={{ color: 'var(--safe-color)' }}>{simulationData.optimized_peak.toFixed(1)}</span><span className="kpi-unit" style={{ color: 'rgba(16,185,129,0.7)' }}>kW</span></div>
            </div>
            <div className="glass-panel kpi-card">
              <div className="kpi-title">Peak Reduction</div>
              <div>
                <span className="kpi-value" style={{ color: simulationData.peak_reduction > 0 ? 'var(--safe-color)' : 'var(--critical-color)' }}>
                  {simulationData.peak_reduction.toFixed(1)}
                </span>
                <span className="kpi-unit" style={{ color: simulationData.peak_reduction > 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)' }}>%</span>
              </div>
            </div>
          </div>

          <div className="grid-cols-3">
            <div className="glass-panel kpi-card">
              <div className="kpi-title">Deadline Compliance</div>
              <div>
                <span className="kpi-value">{simulationData.deadline_compliance.toFixed(1)}</span><span className="kpi-unit">%</span>
              </div>
            </div>
            <div className="glass-panel kpi-card">
              <div className="kpi-title">Feasibility</div>
              <div style={{ marginTop: '4px' }}>
                {simulationData.feasible ? (
                   <span className="status-badge status-safe"><CheckCircle2 size={14} style={{ marginRight: '4px' }}/> Feasible</span>
                ) : (
                   <span className="status-badge status-critical"><AlertOctagon size={14} style={{ marginRight: '4px' }}/> Infeasible</span>
                )}
              </div>
            </div>
            <div className="glass-panel kpi-card">
              <div className="kpi-title">Constraint Violations</div>
              <div><span className="kpi-value">{simulationData.constraint_violations}</span></div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem' }}>Load Comparison: Baseline vs SmartCharge</h3>
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={simulationData.baseline_time_series ? simulationData.baseline_time_series.map((val, i) => ({
                  name: `T+${i/2}h`,
                  'Baseline Load': val,
                  'SmartCharge Load': simulationData.optimized_time_series[i]
                })) : []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#141a28', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Legend />
                  <Bar dataKey="Baseline Load" fill="#64748b" />
                  <Bar dataKey="SmartCharge Load" fill="#10b981" />
                  <ReferenceLine y={simulationData.grid_capacity || 2500.0} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Grid Capacity', fill: '#ef4444' }} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                <em>Chart aggregates all EV schedules to demonstrate peak shaving.</em>
              </div>
            </div>
          </div>
          
        </div>
      )}
      
      {!simulationData && !loading && !error && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <Zap size={48} color="#3b82f6" style={{ opacity: 0.5, marginBottom: '1rem' }}/>
          <h3>No Simulation Data</h3>
          <p>Click "Run SmartCharge" to generate the deterministic scenario.</p>
        </div>
      )}
    </div>
  );
}
