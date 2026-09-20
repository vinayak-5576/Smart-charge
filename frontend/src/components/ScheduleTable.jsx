import React, { useState } from 'react';
import EVDetail from './EVDetail';
import { 
  Calendar, 
  Search, 
  BatteryCharging, 
  Zap, 
  ArrowUpDown, 
  Clock, 
  CheckCircle2,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function ScheduleTable({ simulationData }) {
  const [selectedEV, setSelectedEV] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);

  // Generate fallback telemetry requests if simulation hasn't been executed yet
  const fallbackRequests = React.useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const arr = new Date(Date.now() + i * 3600000);
      const stayHours = 2 + (i % 6);
      const dep = new Date(arr.getTime() + stayHours * 3600000);
      const soc = 0.2 + ((i * 17) % 60) / 100;
      return {
        ev_id: `EV-${1000 + i}`,
        station_id: `STATION-0${(i % 8) + 1}`,
        arrival_time: arr.toISOString(),
        departure_deadline: dep.toISOString(),
        energy_required_kWh: 18.5 + (i * 3.4) % 45,
        initial_soc: soc,
        target_soc: 0.90,
        allocated_power_kW: 11 + (i % 4) * 11
      };
    });
  }, []);

  const evRequests = (simulationData && simulationData.ev_requests_data && simulationData.ev_requests_data.length > 0)
    ? simulationData.ev_requests_data
    : fallbackRequests;

  const isSimulated = Boolean(simulationData && simulationData.ev_requests_data);

  // Filter logic
  const filteredEVs = evRequests.filter(ev => {
    const matchesSearch = ev.ev_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ev.station_id.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterUrgentOnly) {
      const arrDate = new Date(ev.arrival_time);
      const depDate = new Date(ev.departure_deadline);
      const urgency = (depDate - arrDate) / (1000 * 60 * 60);
      return urgency <= 3;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Control & Search Ribbon */}
      <div className="cockpit-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div className="panel-title">
              <Calendar size={15} color="var(--accent-mint)" />
              <span className="panel-title-text">EV Fleet Charging Schedule & Dispatch Table</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {isSimulated ? `OPTIMIZATION RESULT // ${evRequests.length} ACTIVE DISPATCHES` : `PREVIEW MODE // SAMPLE TELEMETRY (EXECUTE SIMULATION FOR REAL-TIME LP)`}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className={`btn-cockpit ${filterUrgentOnly ? 'primary' : ''}`}
              onClick={() => setFilterUrgentOnly(!filterUrgentOnly)}
              style={{ padding: '6px 12px', fontSize: '0.72rem' }}
            >
              <Filter size={12} />
              <span>{filterUrgentOnly ? 'SHOWING URGENT' : 'FILTER URGENT'}</span>
            </button>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search 
                size={14} 
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} 
              />
              <input 
                type="text" 
                placeholder="SEARCH EV ID OR STATION..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="cockpit-input"
                style={{ width: '100%', paddingLeft: '32px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Table */}
      <div className="telemetry-table-container">
        <table className="telemetry-table">
          <thead>
            <tr>
              <th>EV Identifier</th>
              <th>Station Port</th>
              <th>Arrival Time</th>
              <th>Departure Deadline</th>
              <th>Energy Demand</th>
              <th>Battery State (SOC)</th>
              <th>Dispatch Status</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredEVs.map(ev => {
              const arrDate = new Date(ev.arrival_time);
              const depDate = new Date(ev.departure_deadline);
              const durationHours = Math.max(0.5, (depDate - arrDate) / (1000 * 60 * 60));
              
              let status = "SCHEDULED";
              let badgeClass = "safe";

              if (durationHours <= 2.5) {
                status = "URGENT";
                badgeClass = "critical";
              } else if (durationHours <= 4.0) {
                status = "EXPEDITE";
                badgeClass = "warning";
              }

              const socPercent = ev.initial_soc !== undefined ? Math.round(ev.initial_soc * 100) : 45;

              return (
                <tr key={ev.ev_id} onClick={() => setSelectedEV(ev)}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '4px', height: '14px', background: badgeClass === 'critical' ? 'var(--critical-color)' : 'var(--accent-mint)', borderRadius: '1px' }}></span>
                      {ev.ev_id}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {ev.station_id}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: '4px' }}>
                      {arrDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: '4px' }}>
                      ({durationHours.toFixed(1)}h window)
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    <span style={{ color: '#fff' }}>{ev.energy_required_kWh.toFixed(1)}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginLeft: '4px' }}>kWh</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '130px' }}>
                      <div className="load-progress-track" style={{ flex: 1, height: '4px' }}>
                        <div 
                          className="load-progress-fill" 
                          style={{ 
                            width: `${socPercent}%`, 
                            background: socPercent < 30 ? 'var(--critical-color)' : socPercent < 60 ? 'var(--warning-color)' : 'var(--accent-mint)' 
                          }}
                        />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#fff', minWidth: '32px' }}>
                        {socPercent}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${badgeClass}`}>
                      {status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    <ChevronRight size={14} />
                  </td>
                </tr>
              );
            })}
            {filteredEVs.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '36px', fontFamily: 'var(--font-mono)' }}>
                  NO EV TELEMETRY FOUND MATCHING QUERY.
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
