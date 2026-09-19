import React from 'react';
import { X, BatteryCharging, Clock, Zap } from 'lucide-react';

export default function EVDetail({ ev, onClose }) {
  if (!ev) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      
      <div className="glass-panel" style={{ width: '500px', maxWidth: '90%', padding: '0' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BatteryCharging color="var(--accent-color)" /> {ev.ev_id}
            </h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Station: {ev.station_id}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="grid-cols-2">
            <div>
              <div className="kpi-title">Arrival</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>T+{ev.arrival_time}h</div>
            </div>
            <div>
              <div className="kpi-title">Deadline</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>T+{ev.departure_time}h</div>
            </div>
            <div>
              <div className="kpi-title">Current SOC</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--warning-color)' }}>{(ev.initial_soc * 100).toFixed(0)}%</div>
            </div>
            <div>
              <div className="kpi-title">Target SOC</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--safe-color)' }}>{(ev.target_soc * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Clock size={18} color="#3b82f6" />
              <strong style={{ color: '#3b82f6' }}>Recommended Charging Window</strong>
            </div>
            <p style={{ margin: 0 }}>
              Based on grid congestion forecasts, this EV is scheduled to charge from <strong>T+{ev.arrival_time}h</strong> to <strong>T+{ev.departure_time}h</strong>. 
            </p>
          </div>

          <div>
            <div className="kpi-title">Required Energy</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={24} color="#f59e0b" />
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{ev.energy_required_kWh.toFixed(1)} kWh</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
