import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Activity, Calendar, Zap, ZapOff, AlertCircle, ShieldCheck } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ScheduleTable from './components/ScheduleTable';
import SimulationPanel from './components/SimulationPanel';
import AlertsPanel from './components/AlertsPanel';
import AuditLog from './components/AuditLog';

function App() {
  const [simulationData, setSimulationData] = useState(null);

  return (
    <div className="app-container">
      <nav className="nav-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Zap size={28} color="#3b82f6" />
          <h2 style={{ margin: 0, letterSpacing: '-0.025em' }}>SmartCharge</h2>
        </div>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} /> Command Center
            </div>
          </NavLink>
          <NavLink to="/schedule" className={({ isActive }) => isActive ? "active" : ""}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} /> Charging Schedule
            </div>
          </NavLink>
          <NavLink to="/simulation" className={({ isActive }) => isActive ? "active" : ""}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ZapOff size={18} /> Simulation / Impact
            </div>
          </NavLink>
          <NavLink to="/alerts" className={({ isActive }) => isActive ? "active" : ""}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> Alerts
            </div>
          </NavLink>
          <NavLink to="/audit" className={({ isActive }) => isActive ? "active" : ""}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} /> Audit Log
            </div>
          </NavLink>
        </div>
      </nav>

      <main className="fade-in">
        <Routes>
          <Route path="/" element={<Dashboard simulationData={simulationData} />} />
          <Route path="/schedule" element={<ScheduleTable simulationData={simulationData} />} />
          <Route path="/simulation" element={<SimulationPanel setSimulationData={setSimulationData} simulationData={simulationData} />} />
          <Route path="/alerts" element={<AlertsPanel />} />
          <Route path="/audit" element={<AuditLog />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
