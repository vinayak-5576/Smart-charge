import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { 
  Activity, 
  Calendar, 
  Zap, 
  AlertCircle, 
  ShieldCheck, 
  TrendingUp, 
  Wifi, 
  Sun,
  Sliders
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ScheduleTable from './components/ScheduleTable';
import SimulationPanel from './components/SimulationPanel';
import AlertsPanel from './components/AlertsPanel';
import AuditLog from './components/AuditLog';
import PlanningWorkspace from './components/PlanningWorkspace';

function App() {
  const [simulationData, setSimulationData] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Precision AERA-style Top Automotive Header */}
      <header className="aera-header">
        <div className="brand-cluster">
          <div className="brand-badge">⚡</div>
          <div className="brand-meta">
            <div className="brand-title">
              SmartCharge
              <span style={{ 
                fontSize: '0.62rem', 
                color: 'var(--accent-mint)', 
                border: '1px solid var(--safe-border)',
                background: 'var(--safe-bg)',
                padding: '1px 6px',
                borderRadius: '2px',
                letterSpacing: '0.1em'
              }}>
                OS v2.4
              </span>
            </div>
            <div className="brand-subtitle">EV SYSTEM READY // GRID AWARE</div>
          </div>
        </div>

        <nav className="nav-cluster">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>
            <Activity size={15} />
            <span>Command Center</span>
          </NavLink>
          <NavLink to="/schedule" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Calendar size={15} />
            <span>Schedule</span>
          </NavLink>
          <NavLink to="/simulation" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Zap size={15} />
            <span>Simulation</span>
          </NavLink>
          <NavLink to="/planning" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <TrendingUp size={15} />
            <span>Planning</span>
          </NavLink>
          <NavLink to="/alerts" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <AlertCircle size={15} />
            <span>Alerts</span>
          </NavLink>
          <NavLink to="/audit" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <ShieldCheck size={15} />
            <span>Audit</span>
          </NavLink>
        </nav>

        <div className="header-telemetry">
          <div className="telemetry-item" title="Telemetry Uplink Stable">
            <Wifi size={14} color="var(--text-secondary)" />
            <span>5G-GRID</span>
          </div>
          <div className="telemetry-item">
            <span className="status-indicator-dot"></span>
            <span style={{ color: 'var(--accent-mint)', fontWeight: 600 }}>ONLINE</span>
          </div>
          <div className="telemetry-item" style={{ color: '#fff', fontWeight: 600, minWidth: '65px' }}>
            {currentTime || '16:58:00'}
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="main-viewport">
        <Routes>
          <Route path="/" element={<Dashboard simulationData={simulationData} />} />
          <Route path="/schedule" element={<ScheduleTable simulationData={simulationData} />} />
          <Route path="/simulation" element={<SimulationPanel setSimulationData={setSimulationData} simulationData={simulationData} />} />
          <Route path="/planning" element={<PlanningWorkspace />} />
          <Route path="/alerts" element={<AlertsPanel />} />
          <Route path="/audit" element={<AuditLog />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
