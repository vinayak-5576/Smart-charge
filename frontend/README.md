# SmartCharge // Cockpit Frontend

The frontend client for the **SmartCharge** Grid Intelligence Platform, built with React, Vite, Recharts, and a custom automotive telemetry design system inspired by the AERA EV cockpit.

## Features

- **Automotive Dark Design System**: Pure cockpit black (`#06080c`), high-contrast `#00e5a0` neon emerald and `#38bdf8` cyan telemetry accents.
- **Instrument Cluster**: Speedometer-style central load gauge with limit pill badge, live dispatch ratio bar, and power flow diagram.
- **Live 48-Hour Demand Curve**: High-contrast Recharts telemetry graph displaying forecasted background demand vs. grid threshold.
- **What-If Simulation Sandbox**: Preset toggles (`[ECO]`, `[COMFORT]`, `[AGGRESSIVE]`) and real-time stress testing sliders.
- **Fleet Dispatch Table**: Fleet schedule with live SOC mini-progress tracks, urgent filtering, and detailed EV telemetry modal.
- **Dual-Scenario Planning**: Side-by-side Scenario A vs. Scenario B benchmark simulator.
- **Diagnostics & Ledger**: Real-time alarm feed and immutable audit trail.

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
