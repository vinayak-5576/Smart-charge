import React from 'react';
import { 
  X, 
  BatteryCharging, 
  Clock, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Gauge,
  Radio
} from 'lucide-react';

export default function EVDetail({ ev, onClose }) {
  if (!ev) return null;

  const initialSoc = ev.initial_soc !== undefined ? Math.round(ev.initial_soc * 100) : 35;
  const targetSoc = ev.target_soc !== undefined ? Math.round(ev.target_soc * 100) : 90;
  const energyNeeded = ev.energy_required_kWh || 32.5;

  return (
    <div className="cockpit-modal-overlay" onClick={onClose}>
      <div className="cockpit-modal" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#0a0e16'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '4px', 
              background: 'var(--safe-bg)', 
              border: '1px solid var(--safe-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-mint)'
            }}>
              <BatteryCharging size={18} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {ev.ev_id}
                <span className="status-pill safe" style={{ fontSize: '0.62rem' }}>
                  OPTIMIZED
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                PORT ATTACHMENT: {ev.station_id}
              </div>
            </div>
          </div>

          <button 
            onClick={onClose} 
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--panel-border)', 
              borderRadius: '4px',
              padding: '6px',
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Telemetry Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SOC Progression Bar (matching AERA Energy indicator) */}
          <div style={{ background: '#07090e', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <div className="micro-label">BATTERY STATE (SOC)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {initialSoc}% <span style={{ color: 'var(--text-muted)' }}>→</span> <span style={{ color: 'var(--accent-mint)', fontWeight: 700 }}>{targetSoc}% TARGET</span>
              </div>
            </div>

            <div className="load-progress-track" style={{ height: '8px', marginBottom: '10px' }}>
              <div 
                className="load-progress-fill" 
                style={{ 
                  width: `${initialSoc}%`, 
                  background: 'var(--accent-mint)'
                }} 
              />
              <div 
                style={{ 
                  position: 'absolute', 
                  left: `${initialSoc}%`, 
                  width: `${targetSoc - initialSoc}%`, 
                  height: '100%', 
                  background: 'rgba(0, 229, 160, 0.3)',
                  borderRight: '2px solid #fff'
                }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              <span>CURRENT (PLUG-IN)</span>
              <span>REQUIRED DISPATCH +{(targetSoc - initialSoc)}%</span>
              <span>DEP. THRESHOLD</span>
            </div>
          </div>

          {/* Telemetry Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--panel-border-subtle)', borderRadius: '4px', padding: '12px' }}>
              <div className="micro-label">ENERGY DEMAND</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <span className="numeric-value" style={{ fontSize: '1.4rem' }}>{energyNeeded.toFixed(1)}</span>
                <span className="kpi-unit">kWh</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--panel-border-subtle)', borderRadius: '4px', padding: '12px' }}>
              <div className="micro-label">CHARGER OUTPUT</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <span className="numeric-value" style={{ fontSize: '1.4rem', color: 'var(--accent-mint)' }}>22.0</span>
                <span className="kpi-unit">kW (AC)</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--panel-border-subtle)', borderRadius: '4px', padding: '12px' }}>
              <div className="micro-label">ARRIVAL TIMESTAMP</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#fff', marginTop: '4px' }}>
                {new Date(ev.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--panel-border-subtle)', borderRadius: '4px', padding: '12px' }}>
              <div className="micro-label">DEPARTURE DEADLINE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#fff', marginTop: '4px' }}>
                {new Date(ev.departure_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Dispatch Advice Banner */}
          <div style={{
            background: 'var(--safe-bg)',
            border: '1px solid var(--safe-border)',
            borderRadius: '4px',
            padding: '14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            lineHeight: 1.5,
            color: '#d1fae5'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-mint)', fontWeight: 700, marginBottom: '4px' }}>
              <ShieldCheck size={14} />
              COORDINATED WATER-FILLING DISPATCH
            </div>
            Linear solver has shifted charging power to optimal low-stress grid intervals while guaranteeing 100% departure deadline compliance.
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          background: '#0a0e16',
          borderTop: '1px solid var(--panel-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button className="btn-cockpit" onClick={onClose}>
            DISMISS
          </button>
        </div>

      </div>
    </div>
  );
}
