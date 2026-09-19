import React, { useState } from 'react';
import EVDetail from './EVDetail';
import { Calendar, Search } from 'lucide-react';

export default function ScheduleTable({ simulationData }) {
  const [selectedEV, setSelectedEV] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!simulationData) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
        <Calendar size={48} color="#3b82f6" style={{ opacity: 0.5, marginBottom: '1rem' }}/>
        <h3>No Schedule Available</h3>
        <p>Run a simulation in the Command Center to generate an EV charging schedule.</p>
      </div>
    );
  }

  const evRequests = simulationData.ev_requests_data || [];
  
  // Filter
  const filteredEVs = evRequests.filter(ev => 
    ev.ev_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ev.station_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Charging Schedule</h2>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search EV ID or Station..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 10px 10px 40px', 
              borderRadius: '8px',
              border: '1px solid var(--panel-border)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div className="glass-panel table-container">
        <table>
          <thead>
            <tr>
              <th>EV ID</th>
              <th>Station</th>
              <th>Arrival Time</th>
              <th>Deadline</th>
              <th>Required Energy (kWh)</th>
              <th>Init SOC</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEVs.map(ev => {
              // Status logic
              const arrDate = new Date(ev.arrival_time);
              const depDate = new Date(ev.departure_deadline);
              const urgency = (depDate - arrDate) / (1000 * 60 * 60); // hours
              
              let status = "SCHEDULED";
              let badgeClass = "status-safe";
              
              if (urgency <= 2) {
                status = "URGENT";
                badgeClass = "status-critical";
              }

              const formatOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };

              return (
                <tr key={ev.ev_id} onClick={() => setSelectedEV(ev)}>
                  <td style={{ fontWeight: 600 }}>{ev.ev_id}</td>
                  <td>{ev.station_id}</td>
                  <td>{arrDate.toLocaleString([], formatOptions)}</td>
                  <td>{depDate.toLocaleString([], formatOptions)}</td>
                  <td>{ev.energy_required_kWh.toFixed(2)}</td>
                  <td>{ev.initial_soc !== undefined ? (ev.initial_soc * 100).toFixed(0) + '%' : 'N/A'}</td>
                  <td><span className={`status-badge ${badgeClass}`}>{status}</span></td>
                </tr>
              )
            })}
            {filteredEVs.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                  No EVs found matching search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedEV && (
        <EVDetail ev={selectedEV} onClose={() => setSelectedEV(null)} />
      )}
    </div>
  );
}
