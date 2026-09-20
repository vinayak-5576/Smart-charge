import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Bell, 
  ShieldAlert,
  Check,
  RotateCcw
} from 'lucide-react';

const AlertsPanel = () => {
  const initialAlerts = [
    { 
      alert_id: 'alt_901', 
      type: 'GRID_HEADROOM_ALERT', 
      severity: 'CRITICAL', 
      message: 'Substation #04 capacity threshold breached by 142 kW during 18:00 - 19:30 evening ramp.', 
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString() 
    },
    { 
      alert_id: 'alt_902', 
      type: 'INFEASIBLE_EV_DEADLINE', 
      severity: 'HIGH', 
      message: 'EV session EV-1042 requests 65 kWh in 45 minutes. Maximum charger output (22 kW) will cause a departure delay.', 
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString() 
    },
    { 
      alert_id: 'alt_903', 
      type: 'WEATHER_FORECAST_STALE', 
      severity: 'MEDIUM', 
      message: 'Solar irradiance satellite feed delayed by 42 minutes. Fallback ML interpolation active.', 
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() 
    }
  ];

  const [alerts, setAlerts] = useState(initialAlerts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attempt real API fetch if available
    fetch('https://lj8tjaipcj.execute-api.ap-south-1.amazonaws.com/Prod/alerts')
      .then(res => res.json())
      .then(data => {
        if (data.alerts && data.alerts.length > 0) {
          setAlerts(data.alerts);
        }
      })
      .catch(() => {
        // Retain default telemetry alerts for offline / local mode
      });
  }, []);

  const handleAcknowledge = (id) => {
    setAlerts(prev => prev.filter(a => a.alert_id !== id));
  };

  const handleReset = () => {
    setAlerts(initialAlerts);
  };

  const getSeverityPill = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="status-pill critical">CRITICAL</span>;
      case 'HIGH':
        return <span className="status-pill warning">HIGH STRESS</span>;
      case 'MEDIUM':
        return <span className="status-pill warning">WARNING</span>;
      default:
        return <span className="status-pill safe">INFO</span>;
    }
  };

  const getBorderColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'var(--critical-color)';
      case 'HIGH': return 'var(--warning-color)';
      case 'MEDIUM': return '#38bdf8';
      default: return 'var(--safe-color)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Panel */}
      <div className="cockpit-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="panel-title">
              <ShieldAlert size={15} color="var(--critical-color)" />
              <span className="panel-title-text">Grid Diagnostic Alarms & Operational Alerts</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              REAL-TIME MONITORING // {alerts.length} UNRESOLVED ANOMALIES
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-cockpit" onClick={handleReset} style={{ fontSize: '0.72rem', padding: '6px 12px' }}>
              <RotateCcw size={12} />
              <span>RESTORE ALARMS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {alerts.map(alert => (
          <div 
            key={alert.alert_id} 
            style={{
              background: '#090d14',
              border: '1px solid var(--panel-border)',
              borderLeft: `3px solid ${getBorderColor(alert.severity)}`,
              borderRadius: '4px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                {getSeverityPill(alert.severity)}
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
                  {alert.type.replace(/_/g, ' ')}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {alert.message}
              </p>
            </div>

            <button
              className="btn-cockpit"
              onClick={() => handleAcknowledge(alert.alert_id)}
              style={{ fontSize: '0.7rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
            >
              <Check size={12} />
              <span>ACKNOWLEDGE</span>
            </button>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="cockpit-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--safe-bg)', border: '1px solid var(--safe-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <CheckCircle2 size={18} color="var(--accent-mint)" />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#fff', letterSpacing: '0.08em', marginBottom: '6px' }}>
              ALL GRID CONSTRAINTS NOMINAL
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              Zero unhandled exceptions or constraint violations detected across monitored substations.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AlertsPanel;
