# Real-World Production Hardening & Appliance Safety Optimization

Comprehensive implementation plan to elevate EcoPulse from MVP to a production-hardened residential energy orchestrator for Amazon Fire TV and smart home microgrids. This plan addresses real-world electrical constraints, persistent user state, and deterministic fallback resilience against Gemini API 429 rate limits and external weather downtime.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user in Phase 1 interactive clarification:
> - **Breaker Load Safety**: Main breaker load limits take precedence to prevent simultaneous high-draw appliances from tripping residential breakers.
> - **State Persistence**: Browser `localStorage` persistence with a 1-click "Reset to Factory Defaults" button for customized schedules and carbon budgets.
> - **API Resilience**: Seamless local engineering heuristics with a clear, subtle offline status indicator when Gemini API reaches 429 quota limits or external weather APIs time out.

- **Service Rating Baseline**: 100A / 200A standard residential service panel with an 80% National Electrical Code (NEC) continuous draw safety margin (16.0 kW peak household headroom cap).
- **Fallback Provenance**: Dynamic local carbon-intensity scheduling algorithms running directly on the client/server when Gemini API quota limits occur.

---

## 1. Overview & Core Concept

EcoPulse is a 10-foot television interface designed for Amazon Fire TV and smart home microgrids. In real-world homes, naively concentrating all heavy appliances into a single "clean solar hour" can trip the main service panel breaker or overwhelm residential circuits.

This update introduces:
1. **Breaker Headroom & Load Staggering Engine**: A real-world electrical governor that monitors simultaneous appliance draw against household breaker capacity (e.g. 16.0 kW continuous rating). If an automated shift creates a concurrency spike, it intelligently staggers heavy loads (e.g., Level 2 EV charging at 1:00 PM, heat pump water heater pre-heating at 2:30 PM, dishwasher at 4:00 PM) while remaining in clean solar windows.
2. **Persistent Household State**: Appliance states, scheduled start times, cumulative emissions prevented, unlocked achievement badges, and custom daily carbon budgets persist across reloads via `localStorage`, accompanied by an accessible "Reset Defaults" action.
3. **Resilient Local Heuristics & Quota Shielding**: Graceful handling of Gemini 429 quota exhaustion and Open-Meteo downtime. The app seamlessly transitions to local physical heuristics with a subtle engine mode badge, preventing any broken UI, spinner lockups, or unhandled errors.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Appliance Hub & Breaker Monitor**:
   - The user views the Appliance Hub, which now features a prominent **Main Breaker Headroom Gauge** showing real-time household draw versus safety limit (e.g., `4.8 kW / 16.0 kW (30% Load) - Safe`).
   - If scheduled appliances overlap to exceed the safe threshold, the UI flags a **Breaker Overload Warning** and offers a 1-click **Auto-Stagger Schedule** action.
2. **Offline & Heuristic Transparency**:
   - When Gemini API quotas are exhausted (HTTP 429), the top bar displays a subtle badge: `"Engine: Local Heuristics"` vs `"Engine: Gemini AI"`.
   - All optimization features (Load Shift, Alexa Routine, Efficiency Diagnostic) continue to generate rich, context-specific results without failure.
3. **Settings & State Management**:
   - Users can customize their Daily Carbon Budget (e.g. 4.0 kg to 12.0 kg), shift schedules manually, and tap **Reset Defaults** to cleanly restore baseline telemetry.
4. **Fire TV Remote D-Pad Navigation**:
   - Full spatial navigation compliance across all interactive controls with clear emerald focus halos, 0-latency feedback, and Web Audio SFX.

### Visual Styling & Design System
- **Theme**: Neutral dark slate (`#0B0F17`) canvas with emerald (`#10B981`) clean energy accents, amber (`#F59E0B`) grid peak indicators, and coral (`#EF4444`) overload warnings.
- **Typography**: Display structure in geometric sans, dense telemetry in tabular monospace (`font-mono tabular-nums`), and clean unboxed metadata with `·` separators (Zero-Pill Discipline).
- **Top Bar Contract**: Single brand wordmark (`EcoPulse`), 5 single-line navigation tabs, and 1 primary action button (`Optimize Grid`).

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Breaker Safety Over Pure Solar Window Compression
- *Chosen Approach*: Enforce a 16.0 kW concurrent threshold (standard 200A panel with 80% continuous safety factor). Stagger concurrent high-draw devices into adjacent clean hours.
- *Why*: In a real electrical installation, running a 7.2 kW EV charger, a 3.8 kW heat pump, and a 3.5 kW dryer simultaneously will trip branch or main breakers.
- *Alternatives Considered*: Stacking all loads at 1:00 PM max solar peak (rejected due to physical fire/breaker hazards).

### Decision 2: Dual-Mode Persistence Architecture
- *Chosen Approach*: Web `localStorage` wrapper with JSON schema validation, automatic migration, and a fallback to in-memory state if private browsing blocks storage.
- *Why*: Allows persistent tracking of carbon savings and achievements across TV sessions without requiring a heavy remote user authentication database for local smart hub displays.

### Decision 3: Zero-Failure Deterministic Heuristic Engine
- *Chosen Approach*: Implement mathematical grid-curve optimization algorithms that calculate carbon integrals and solar overlaps locally when Gemini API returns 429 or network errors.
- *Why*: Protects the user experience from API rate limits and network degradation while providing immediate, high-fidelity suggestions.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EcoPulse Fire TV Client                         │
│                                                                        │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │   Ambient Biosphere   │  │  Appliance Hub  │  │  Carbon Timeline │  │
│  │ (Weather & Solar Pkg) │  │ (Breaker Safety)│  │ (24h Forecast)   │  │
│  └───────────────────────┘  └─────────────────┘  └──────────────────┘  │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │    Energy Savings     │  │  Alexa Routine  │  │ Virtual Remote   │  │
│  │ (Achievements & Co2)  │  │ (MCP & Dialog)  │  │ (Spatial D-Pad)  │  │
│  └───────────────────────┘  └─────────────────┘  └──────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           │                                                 │
           ▼                                                 ▼
┌─────────────────────────────┐           ┌───────────────────────────────┐
│     Local Storage Cache     │           │     Express Backend Proxy     │
│  - Appliance Schedules      │           │                               │
│  - Carbon Budget (kg)       │           │  /api/weather (Open-Meteo)    │
│  - Unlocked Milestones      │           │  /api/gemini/optimize         │
│  - Factory Reset Engine     │           │  /api/gemini/alexa-routine    │
└─────────────────────────────┘           │  /api/gemini/efficiency-alert │
                                          └──────────────┬────────────────┘
                                                         │
                                   ┌─────────────────────┴────────────────┐
                                   ▼                                      ▼
                      ┌─────────────────────────┐             ┌────────────────────────┐
                      │ Gemini 3.8 Flash API    │             │ Local Heuristic Engine │
                      │ (Live Semantic Engine)  │──[429/Err]─▶│ (Deterministic Rules   │
                      └─────────────────────────┘             │  & Breaker Safety Math)│
                                                              └────────────────────────┘
```

### State Model & Persistence Keys
- `ecopulse_appliances_v2`: Active appliances, schedule start hour, status (`idle`, `running`, `optimized`), and power draw.
- `ecopulse_carbon_budget_v2`: Daily target in kg CO2 (default `6.0`).
- `ecopulse_achievements_v2`: Unlocked badge IDs and progress values.
- `ecopulse_engine_mode`: UI indicator tracking live API vs heuristic fallback.

### Verification Plan
1. **Breaker Conflict Verification**: Trigger simultaneous runs of EV Charger (7.2 kW), Heat Pump (3.8 kW), and Dryer (3.5 kW) and verify the breaker alert triggers with automatic schedule staggering.
2. **API 429 Fallback Testing**: Simulate quota exhaustion on `/api/gemini/optimize`, `/api/gemini/alexa-routine`, and `/api/gemini/efficiency-alert` to ensure zero uncaught errors and verified modal displays.
3. **Persistence Verification**: Change schedules and budget, reload the page, and confirm values persist; test the "Reset Defaults" button to confirm full restoration.
4. **Compilation & Linting**: Run `compile_applet` and `lint_applet` to ensure 0 TypeScript or build warnings.
