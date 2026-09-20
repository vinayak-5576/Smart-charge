import React, { useState } from 'react';
import { api } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Play, CheckCircle2, AlertOctagon, Scale } from 'lucide-react';

export default function PlanningWorkspace() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Scenario A
  const [evGrowthA, setEvGrowthA] = useState(0);
  const [solarGrowthA, setSolarGrowthA] = useState(0);
  const [scenarioA, setScenarioA] = useState(null);

  // Scenario B
  const [evGrowthB, setEvGrowthB] = useState(50);
  const [solarGrowthB, setSolarGrowthB] = useState(20);
  const [scenarioB, setScenarioB] = useState(null);

  const handleRunComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const configA = {
        scenario_type: 'mock',
        num_evs: 500,
        flexibility_buffer_hours: 4.0,
        grid_capacity: 2500.0,
        num_stations: 20,
        station_capacity: 105.0,
        dt_hours: 0.5,
        forecast_modifier: 0.0,
        ev_growth_percent: evGrowthA,
        solar_capacity_modifier: solarGrowthA
      };

      const configB = { ...configA, ev_growth_percent: evGrowthB, solar_capacity_modifier: solarGrowthB };

      const [resA, resB] = await Promise.all([
        api.simulateWhatIf(configA),
        api.simulateWhatIf(configB)
      ]);

      if (resA.baseline_peak === undefined || resB.baseline_peak === undefined) {
        throw new Error("Simulation failed critically on the backend.");
      }

      setScenarioA(resA);
      setScenarioB(resB);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderKPIs = (data, title) => {
    if (!data) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>{title}</h3>
        <div className="grid-cols-2">
          <div className="glass-panel kpi-card" style={{ padding: '1rem' }}>
            <div className="kpi-title" style={{ fontSize: '0.8rem' }}>Unmanaged Peak</div>
            <div><span className="kpi-value" style={{ fontSize: '1.2rem' }}>{data.baseline_peak.toFixed(1)}</span><span className="kpi-unit">kW</span></div>
          </div>
          <div className="glass-panel kpi-card" style={{ padding: '1rem', background: 'var(--safe-bg)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="kpi-title" style={{ fontSize: '0.8rem', color: 'var(--safe-color)' }}>Optimized Peak</div>
            <div><span className="kpi-value" style={{ fontSize: '1.2rem', color: 'var(--safe-color)' }}>{data.optimized_peak.toFixed(1)}</span><span className="kpi-unit" style={{ color: 'rgba(16,185,129,0.7)' }}>kW</span></div>
          </div>
        </div>
        <div className="grid-cols-2">
           <div className="glass-panel kpi-card" style={{ padding: '1rem' }}>
            <div className="kpi-title" style={{ fontSize: '0.8rem' }}>Feasibility</div>
            <div style={{ marginTop: '4px' }}>
              {data.feasible ? (
                 <span className="status-badge status-safe" style={{ fontSize: '0.8rem' }}><CheckCircle2 size={12} style={{ marginRight: '4px' }}/> Feasible</span>
              ) : (
                 <span className="status-badge status-critical" style={{ fontSize: '0.8rem' }}><AlertOctagon size={12} style={{ marginRight: '4px' }}/> Infeasible</span>
              )}
            </div>
          </div>
           <div className="glass-panel kpi-card" style={{ padding: '1rem' }}>
            <div className="kpi-title" style={{ fontSize: '0.8rem' }}>Violations</div>
            <div><span className="kpi-value" style={{ fontSize: '1.2rem' }}>{data.constraint_violations}</span></div>
          </div>
        </div>
      </div>
    );
  };

  const getChartData = () => {
    if (!scenarioA || !scenarioB) return [];
    return scenarioA.optimized_time_series.map((valA, i) => ({
      name: `T+${i/2}h`,
      'Scenario A': valA,
      'Scenario B': scenarioB.optimized_time_series[i]
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Infrastructure Planning Workspace</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Compare candidate interventions and adoption scenarios to plan grid capacity upgrades.</p>
          </div>
          <button className="btn btn-primary" onClick={handleRunComparison} disabled={loading}>
            {loading ? <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}/> : <Scale size={18} />}
            {loading ? 'Simulating Scenarios...' : 'COMPARE SCENARIOS'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          {/* Scenario A Controls */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ marginBottom: '1rem', color: '#64748b' }}>Scenario A</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>EV Adoption Growth</span>
                <span style={{ color: 'var(--brand-color)' }}>+{evGrowthA}%</span>
              </label>
              <input 
                type="range" min="0" max="1000" step="50" 
                value={evGrowthA} onChange={(e) => setEvGrowthA(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Renewable Solar Additions</span>
                <span style={{ color: 'var(--safe-color)' }}>+{solarGrowthA}%</span>
              </label>
              <input 
                type="range" min="0" max="200" step="10" 
                value={solarGrowthA} onChange={(e) => setSolarGrowthA(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--safe-color)' }}
              />
            </div>
          </div>

          {/* Scenario B Controls */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ marginBottom: '1rem', color: '#10b981' }}>Scenario B</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>EV Adoption Growth</span>
                <span style={{ color: 'var(--brand-color)' }}>+{evGrowthB}%</span>
              </label>
              <input 
                type="range" min="0" max="1000" step="50" 
                value={evGrowthB} onChange={(e) => setEvGrowthB(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Renewable Solar Additions</span>
                <span style={{ color: 'var(--safe-color)' }}>+{solarGrowthB}%</span>
              </label>
              <input 
                type="range" min="0" max="200" step="10" 
                value={solarGrowthB} onChange={(e) => setSolarGrowthB(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--safe-color)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--critical-color)' }}>
          <h3 style={{ color: 'var(--critical-color)', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertOctagon size={20}/> Error</h3>
          <p>{error}</p>
        </div>
      )}

      {scenarioA && scenarioB && !loading && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'flex', gap: '2rem' }}>
            {renderKPIs(scenarioA, 'Scenario A Outcomes')}
            {renderKPIs(scenarioB, 'Scenario B Outcomes')}
          </div>

          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem' }}>Optimized Load Comparison: Scenario A vs B</h3>
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#141a28', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Legend />
                  <Bar dataKey="Scenario A" fill="#64748b" />
                  <Bar dataKey="Scenario B" fill="#10b981" />
                  <ReferenceLine y={2500.0} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Base Grid Capacity (2500kW)', fill: '#ef4444' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
