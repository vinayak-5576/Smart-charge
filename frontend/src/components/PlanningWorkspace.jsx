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
  Scale, 
  CheckCircle2, 
  AlertOctagon, 
  Car, 
  Sun, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export default function PlanningWorkspace() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Scenario A
  const [evGrowthA, setEvGrowthA] = useState(0);
  const [solarGrowthA, setSolarGrowthA] = useState(0);
  const [scenarioA, setScenarioA] = useState(null);

  // Scenario B
  const [evGrowthB, setEvGrowthB] = useState(100);
  const [solarGrowthB, setSolarGrowthB] = useState(40);
  const [scenarioB, setScenarioB] = useState(null);

  const handleRunComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseConfig = {
        scenario_type: 'mock',
        num_evs: 500,
        flexibility_buffer_hours: 4.0,
        grid_capacity: 2500.0,
        num_stations: 20,
        station_capacity: 105.0,
        dt_hours: 0.5,
        forecast_modifier: 0.0
      };

      const configA = {
        ...baseConfig,
        ev_growth_percent: evGrowthA,
        solar_capacity_modifier: solarGrowthA
      };

      const configB = {
        ...baseConfig,
        ev_growth_percent: evGrowthB,
        solar_capacity_modifier: solarGrowthB
      };

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

  const renderScenarioKPIs = (data, name, accentColor) => {
    if (!data) return null;
    return (
      <div style={{
        background: '#090d14',
        border: '1px solid var(--panel-border)',
        borderRadius: '4px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        flex: 1
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border-subtle)', paddingBottom: '10px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: accentColor }}>
            {name} OUTCOMES
          </div>
          <span className={`status-pill ${data.feasible ? 'safe' : 'critical'}`}>
            {data.feasible ? 'FEASIBLE' : 'INFEASIBLE'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--panel-border-subtle)', padding: '12px', borderRadius: '3px' }}>
            <div className="micro-label">UNMANAGED</div>
            <div className="numeric-value" style={{ fontSize: '1.2rem', color: '#94a3b8', marginTop: '4px' }}>
              {data.baseline_peak.toFixed(0)} <span className="kpi-unit">kW</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--panel-border-subtle)', padding: '12px', borderRadius: '3px' }}>
            <div className="micro-label">OPTIMIZED</div>
            <div className="numeric-value" style={{ fontSize: '1.2rem', color: accentColor, marginTop: '4px' }}>
              {data.optimized_peak.toFixed(0)} <span className="kpi-unit">kW</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--panel-border-subtle)', padding: '12px', borderRadius: '3px' }}>
            <div className="micro-label">PEAK REDUCTION</div>
            <div className="numeric-value" style={{ fontSize: '1.2rem', color: data.peak_reduction > 0 ? 'var(--accent-mint)' : 'var(--critical-color)', marginTop: '4px' }}>
              {data.peak_reduction.toFixed(1)}%
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <span>DEADLINE COMPLIANCE: <strong style={{ color: '#fff' }}>{data.deadline_compliance.toFixed(1)}%</strong></span>
          <span>VIOLATIONS: <strong style={{ color: data.constraint_violations === 0 ? 'var(--accent-mint)' : 'var(--critical-color)' }}>{data.constraint_violations}</strong></span>
        </div>
      </div>
    );
  };

  const getChartData = () => {
    if (!scenarioA || !scenarioB) return [];
    return scenarioA.optimized_time_series.map((valA, i) => ({
      name: `T+${(i * 0.5).toFixed(1)}h`,
      'Scenario A': Number(valA.toFixed(1)),
      'Scenario B': Number(scenarioB.optimized_time_series[i].toFixed(1))
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Configuration Console */}
      <div className="cockpit-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Scale size={15} color="var(--accent-mint)" />
            <span className="panel-title-text">Infrastructure Capacity Planning & Scenario Comparison</span>
          </div>

          <button 
            className="btn-cockpit primary" 
            onClick={handleRunComparison} 
            disabled={loading}
            style={{ minWidth: '180px' }}
          >
            {loading ? (
              <div className="cockpit-loader" style={{ width: '14px', height: '14px', borderWidth: '1.5px' }} />
            ) : (
              <Scale size={13} />
            )}
            <span>{loading ? 'SOLVING BOTH...' : 'COMPARE SCENARIOS'}</span>
          </button>
        </div>

        {/* Dual Scenario Sliders Side-by-Side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '10px' }}>
          
          {/* Scenario A */}
          <div style={{ background: '#090c12', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="micro-label" style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem' }}>SCENARIO A (BASELINE INTERVENTION)</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>EV Adoption Growth</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>+{evGrowthA}%</span>
              </div>
              <input 
                type="range" min="0" max="1000" step="50" 
                value={evGrowthA} onChange={(e) => setEvGrowthA(parseInt(e.target.value))}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Renewable Solar Offset</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>+{solarGrowthA}%</span>
              </div>
              <input 
                type="range" min="0" max="200" step="10" 
                value={solarGrowthA} onChange={(e) => setSolarGrowthA(parseInt(e.target.value))}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
            </div>
          </div>

          {/* Scenario B */}
          <div style={{ background: '#090c12', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="micro-label" style={{ color: 'var(--accent-mint)', fontSize: '0.75rem' }}>SCENARIO B (HIGH-ADOPTION EXPANSION)</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>EV Adoption Growth</span>
                <span style={{ color: 'var(--accent-mint)', fontWeight: 700 }}>+{evGrowthB}%</span>
              </div>
              <input 
                type="range" min="0" max="1000" step="50" 
                value={evGrowthB} onChange={(e) => setEvGrowthB(parseInt(e.target.value))}
                style={{ accentColor: 'var(--accent-mint)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Renewable Solar Offset</span>
                <span style={{ color: 'var(--accent-mint)', fontWeight: 700 }}>+{solarGrowthB}%</span>
              </div>
              <input 
                type="range" min="0" max="200" step="10" 
                value={solarGrowthB} onChange={(e) => setSolarGrowthB(parseInt(e.target.value))}
                style={{ accentColor: 'var(--accent-mint)' }}
              />
            </div>
          </div>

        </div>
      </div>

      {error && (
        <div className="cockpit-panel" style={{ borderColor: 'var(--critical-border)', background: 'var(--critical-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--critical-color)', fontFamily: 'var(--font-mono)' }}>
            <AlertOctagon size={16} />
            COMPARISON RUNTIME EXCEPTION: {error}
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {scenarioA && scenarioB && !loading && (
        <>
          <div style={{ display: 'flex', gap: '20px' }}>
            {renderScenarioKPIs(scenarioA, 'SCENARIO A', 'var(--accent-cyan)')}
            {renderScenarioKPIs(scenarioB, 'SCENARIO B', 'var(--accent-mint)')}
          </div>

          <div className="cockpit-panel">
            <div className="panel-header">
              <div className="panel-title">
                <TrendingUp size={14} color="var(--accent-mint)" />
                <span className="panel-title-text">Simultaneous Dispatch Profiles: Scenario A vs Scenario B</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', background: 'var(--accent-cyan)', borderRadius: '2px', display: 'inline-block' }}></span>
                  <span style={{ color: 'var(--accent-cyan)' }}>Scenario A</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', background: 'var(--accent-mint)', borderRadius: '2px', display: 'inline-block' }}></span>
                  <span style={{ color: 'var(--accent-mint)' }}>Scenario B</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '12px', height: '1px', borderTop: '2px dashed var(--critical-color)', display: 'inline-block' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Base Grid Capacity (2500 kW)</span>
                </div>
              </div>
            </div>

            <div style={{ height: '360px', width: '100%', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={1}>
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
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d14', border: '1px solid var(--panel-border-bright)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }} 
                  />
                  <ReferenceLine y={2500.0} stroke="var(--critical-color)" strokeDasharray="4 4" strokeWidth={1.5} />
                  <Bar dataKey="Scenario A" fill="#38bdf8" radius={[1, 1, 0, 0]} />
                  <Bar dataKey="Scenario B" fill="#00e5a0" radius={[1, 1, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {!scenarioA && !loading && !error && (
        <div className="cockpit-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#101622', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Scale size={18} color="var(--accent-mint)" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#fff', letterSpacing: '0.08em', marginBottom: '6px' }}>
            DUAL SCENARIO BENCHMARK READY
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', maxWidth: '420px', margin: '0 auto' }}>
            Configure adoption rates for both candidate scenarios and click "Compare Scenarios" to run simultaneous optimization.
          </p>
        </div>
      )}

    </div>
  );
}
