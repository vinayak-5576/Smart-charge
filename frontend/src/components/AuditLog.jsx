import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Terminal, 
  Lock, 
  FileText,
  UserCheck
} from 'lucide-react';

const AuditLog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [logs] = useState([
    { id: 'aud_101', timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), operator: 'op_admin', action: 'APPROVE_DISPATCH', target: 'sim_lp_098', details: 'Confirmed LP peak-shaving schedule for Substation 04' },
    { id: 'aud_102', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), operator: 'op_clara', action: 'PRIORITY_OVERRIDE', target: 'EV-1042', details: 'Elevated EV-1042 charging priority to urgent due to fleet emergency' },
    { id: 'aud_103', timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(), operator: 'system_daemon', action: 'GENERATE_FORECAST', target: 'fc_48h_rolling', details: 'Updated Random Forest demand matrix based on latest NOAA weather feed' },
    { id: 'aud_104', timestamp: new Date(Date.now() - 1000 * 60 * 190).toISOString(), operator: 'op_admin', action: 'UPDATE_CAPACITY', target: 'sub_04_limit', details: 'Re-calibrated transformer threshold from 2,400 kW to 2,500 kW' },
    { id: 'aud_105', timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(), operator: 'system_daemon', action: 'CBC_SOLVER_SOLVE', target: 'batch_sim_77', details: 'Deterministic optimization completed with 0 constraint violations in 142ms' },
  ]);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Panel */}
      <div className="cockpit-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div className="panel-title">
              <ShieldCheck size={15} color="var(--accent-mint)" />
              <span className="panel-title-text">Immutable System Audit Log & Operator Ledger</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              SHA-256 VERIFIED TELEMETRY // ALL ACTIONS ENCRYPTED & LOGGED
            </div>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search 
              size={14} 
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} 
            />
            <input 
              type="text" 
              placeholder="SEARCH OPERATOR OR ACTION..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cockpit-input"
              style={{ width: '100%', paddingLeft: '32px' }}
            />
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="telemetry-table-container">
        <table className="telemetry-table">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Operator</th>
              <th>Action Category</th>
              <th>Target Identifier</th>
              <th>Audit Payload / Event Summary</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                </td>
                <td>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    background: '#0d131f',
                    border: '1px solid var(--panel-border)',
                    color: log.operator.startsWith('system') ? 'var(--accent-cyan)' : 'var(--accent-mint)',
                    padding: '2px 8px',
                    borderRadius: '2px'
                  }}>
                    {log.operator}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.78rem', color: '#fff' }}>
                  {log.action}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {log.target}
                </td>
                <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  {log.details}
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '36px', fontFamily: 'var(--font-mono)' }}>
                  NO AUDIT ENTRIES FOUND MATCHING SEARCH QUERY.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AuditLog;
