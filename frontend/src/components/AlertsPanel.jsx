import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback mock data in case backend isn't running
  const mockAlerts = [
    { alert_id: '1', type: 'GRID_VIOLATION', severity: 'CRITICAL', message: 'Simulation sim_abc violates grid capacity constraints by 150kW between 18:00 and 19:30.', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { alert_id: '2', type: 'INFEASIBLE_SCHEDULE', severity: 'HIGH', message: 'EV session EV#402 requires 50kWh in 1 hour. Maximum charger output is 22kW.', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { alert_id: '3', type: 'DATA_STALE', severity: 'MEDIUM', message: 'Weather forecast data is older than 6 hours.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() }
  ];

  useEffect(() => {
    // Fetch from real API connected to DynamoDB
    fetch('http://localhost:8001/alerts')
      .then(res => res.json())
      .then(data => {
        if (data.alerts) {
          setAlerts(data.alerts);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Backend not reachable. Please start the Python server.", err);
        setAlerts([]); // Empty array instead of mock data
        setLoading(false);
      });
  }, []);

  const getIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <AlertCircle size={24} color="#ef4444" />;
      case 'HIGH': return <AlertTriangle size={24} color="#f97316" />;
      case 'MEDIUM': return <Info size={24} color="#3b82f6" />;
      default: return <CheckCircle size={24} color="#22c55e" />;
    }
  };

  if (loading) return <div>Loading alerts...</div>;

  return (
    <div className="panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={24} color="#ef4444" />
        System Alerts
      </h2>
      <p style={{ color: '#64748b', marginBottom: '20px' }}>Active notifications requiring operator review.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {alerts.map(alert => (
          <div key={alert.alert_id} style={{ 
            display: 'flex', 
            gap: '16px', 
            padding: '16px', 
            borderRadius: '8px', 
            borderLeft: `4px solid ${alert.severity === 'CRITICAL' ? '#ef4444' : alert.severity === 'HIGH' ? '#f97316' : '#3b82f6'}`,
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div>{getIcon(alert.severity)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '1.1em' }}>{alert.type.replace('_', ' ')}</strong>
                <span style={{ color: '#94a3b8', fontSize: '0.9em' }}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
              </div>
              <p style={{ margin: 0, color: '#cbd5e1' }}>{alert.message}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.9em' }}>Acknowledge</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsPanel;
