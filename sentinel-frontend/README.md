# 🛡️ SENTINEL — Continuous Privileged Trust & Insider Threat Detection

**CSI ORIGIN 2026 — Problem Statement 9**  
**Privileged Access Misuse & Insider Threat Detection**

---

## 🚀 1. PROJECT OVERVIEW

**SENTINEL** is a Security Operations Console (SOC) platform designed for real-time privileged access behavior analysis and insider threat detection.

### The Fundamental Problem
> **Authorized access does NOT equal authorized behaviour.**

A privileged administrator, financial manager, or automated service account may hold legitimate IAM permission to perform actions (such as initiating wire transfers or exporting data), but the **sequence**, **timing**, **frequency**, **target**, and **monetary parameters** may indicate insider threat misuse or credential compromise.

### Core Detection Flow
```text
OBSERVE ➔ ESTABLISH BASELINE ➔ CORRELATE ACTIONS ➔ DETECT ANOMALY ➔ ASSESS RISK ➔ INVESTIGATE CONTEXT ➔ RESPOND ➔ LEARN
```

---

## ✨ 2. KEY UNIQUE SELLING POINTS (USPs)

1. **Authorized Access vs Authorized Behaviour (USP 1)**: Visual banner distinguishing valid credentials from deviant activity.
2. **Behavioural Baseline (USP 2)**: Normal 30-day baseline vs current execution parameter comparison.
3. **Sequence Intelligence Timeline (USP 3)**: Multi-stage attack chain correlation showing how individually authorized steps create a high-risk sequence.
4. **Peer Intelligence Cohort Comparison (USP 4)**: User vs department peer group median comparison for false-positive reduction.
5. **Contextual Risk Assessment (USP 5)**: Automated evaluation of business exceptions, maintenance windows, and historical risk.
6. **Explainable Risk Score (USP 6)**: Clear breakdown of point contributions (+24 Tx deviation, +19 Beneficiary, +15 After-hours, +12 Device, +11 Privilege, +10 Sequence).
7. **Graduated Response System (USP 7)**: Action suite (`MONITOR`, `VERIFY`, `RESTRICT`, `SUSPEND`, `ESCALATE`) with audit trail creation.
8. **Continuous Learning Loop (USP 8)**: Analyst feedback submission (`CONFIRMED THREAT` / `FALSE POSITIVE`) for ML model baseline updating.

---

## 🛠️ 3. TECHNOLOGY STACK

* **Framework**: React 19 + TypeScript + Vite 8
* **Styling**: Tailwind CSS v4 (Custom SOC Dark Theme Palette)
* **Routing**: React Router v7
* **Data Fetching & State**: TanStack React Query v5
* **Data Visualization**: Recharts v3
* **Icons**: Lucide React
* **Animations**: Framer Motion

---

## 📁 4. FOLDER STRUCTURE

```text
sentinel-frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── analytics/       # Analytics tabbed charts & model stats
│   │   ├── audit/           # Audit ledger tables & timeline
│   │   ├── common/          # Card, Badge, Button, Modal, Skeleton, ErrorState
│   │   ├── dashboard/       # KPI cards, Trust chart, Threat overview, Stream
│   │   ├── identities/      # Inventory table & badges
│   │   ├── investigation/   # USPs 1-8 investigation components & graph
│   │   ├── layout/          # AppShell, Sidebar, TopHeader, Breadcrumb
│   │   └── threats/         # Threat filter controls & threat cards
│   ├── data/
│   │   └── mockData.ts      # 20+ identities, 30+ threats, 100+ events, hero U0345
│   ├── hooks/
│   │   ├── useSecurityData.ts # TanStack Query data hooks
│   │   └── usePolling.ts    # Live stream polling simulation
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ThreatCenter.tsx
│   │   ├── Identities.tsx
│   │   ├── Investigation.tsx
│   │   ├── Analytics.tsx
│   │   ├── Audit.tsx
│   │   └── Settings.tsx
│   ├── services/
│   │   ├── api.ts           # Production REST API client
│   │   ├── mockApi.ts       # Local mock API service
│   │   └── index.ts         # Dual mode switcher
│   ├── types/
│   │   └── security.ts      # TypeScript interfaces
│   ├── utils/
│   │   └── formatters.ts    # Severity colors, currency & date formatting
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env
├── .env.example
├── FRONTEND_BACKEND_INTEGRATION.md
├── package.json
└── README.md
```

---

## ⚡ 5. DUAL INGESTION MODE (DEV / PROD)

* **Dev/Demo Mode (`VITE_USE_MOCK_DATA=true`)**: Uses realistic local JSON telemetry with async latency simulation.
* **Production Mode (`VITE_USE_MOCK_DATA=false`)**: Consumes REST APIs via `VITE_API_BASE_URL`.

---

## 🏃 6. RUNNING LOCALLY

```bash
# 1. Navigate into the frontend folder
cd sentinel-frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start local development server
npm run dev
```

Application will run locally at: `http://localhost:3000`

---

## 🎯 7. JUDGE DEMONSTRATION FLOW (2-MINUTE WALKTHROUGH)

1. **Login (`/login`)**: Click **"Access Security Console"**.
2. **Command Center (`/dashboard`)**:
   * View Security Posture KPIs (Behavioural Trust `78/100`, Active Threats `12`).
   * Observe **Behavioural Trust Over Time** Recharts area graph.
   * View Threat Breakdown (**CRITICAL: 3**, **HIGH: 9**).
   * Observe **Live Behaviour Stream** updating in real time.
3. **Threat Center (`/threats`)**:
   * View threat cards sorted by risk score.
   * Find identity **`U0345`** (Finance Operations, Risk `91/100`).
   * Click **`[ INVESTIGATE ]`**.
4. **Investigation Workspace (`/investigation/U0345`)**:
   * **USP 1**: Notice **Authorized Access vs Authorized Behaviour** banner.
   * **USP 6**: View **Explainable Risk Score (91/100)** breakdown (+24 Tx, +19 Beneficiary, +15 After-hours, +12 Device, +11 Privilege, +10 Sequence).
   * **USP 7**: Test Graduated Response buttons (`SUSPEND` / `ESCALATE`). Confirm action in modal.
   * **USP 3**: Scroll through **Sequence Intelligence Timeline** showing 6-step event escalation leading to sequence risk `94/100`.
   * **USP 2 & 4**: Inspect **Normal vs Current Baseline** and **Peer Group Comparison**.
   * **USP 5**: Check **Contextual Assessment** rules.
   * **USP 8**: Fill out **Analyst Feedback** form (`CONFIRMED THREAT`) and submit.
   * **Topology**: Inspect **Interactive Entity Relationship Graph**.
5. **Audit Ledger (`/audit`)**:
   * Confirm newly enforced response action is immutably logged in the ledger.
