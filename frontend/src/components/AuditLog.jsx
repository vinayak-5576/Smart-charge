import React, { useState } from 'react';
import { ShieldCheck, Search } from 'lucide-react';

const AuditLog = () => {
  const [logs, setLogs] = useState([
    { id: 'aud_1', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), operator: 'op_admin', action: 'APPROVE_SCHEDULE', target: 'sim_abc', details: 'Approved optimization schedule for Zone 1' },
    { id: 'aud_2', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), operator: 'op_jane', action: 'OVERRIDE_SCHEDULE', target: 'sim_xyz', details: 'Forced session EV#105 to full power due to VIP customer complaint' },
    { id: 'aud_3', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), operator: 'system', action: 'CREATE_FORECAST', target: 'fc_0919', details: 'Generated 48h rolling forecast' },
  ]);

  return (
    <div className="panel" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <ShieldCheck size={24} color="#8b5cf6" />
          Audit Trail
        </h2>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '4px' }}>
          <Search size={16} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', width: '200px' }}
          />
        </div>
      </div>
      
      <p style={{ color: '#64748b', marginBottom: '20px' }}>Immutable record of all operator actions, overrides, and critical system events.</p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
              <th style={{ padding: '12px 8px' }}>Timestamp</th>
              <th style={{ padding: '12px 8px' }}>Operator</th>
              <th style={{ padding: '12px 8px' }}>Action</th>
              <th style={{ padding: '12px 8px' }}>Target ID</th>
              <th style={{ padding: '12px 8px' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 8px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85em' }}>
                    {log.operator}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{log.action.replace('_', ' ')}</td>
                <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: '#cbd5e1' }}>{log.target}</td>
                <td style={{ padding: '12px 8px' }}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLog;
