# SENTINEL Live Telemetry Simulation Subsystem (Plane A)

## Overview

The SENTINEL Telemetry Subsystem generates realistic synthetic security event streams to demonstrate continuous live detection, attack sequence escalation, and alert generation.

Synthetic events **traverse the exact same ingestion and detection pipeline** as production events:

```
Synthetic Event Generator
          │
          ▼
Unified Ingestion (POST /api/events)
          │
          ▼
Schema Validation & Bounded Buffer
          │
          ▼
Feature Engineering (10-D Vector)
          │
          ▼
Behavioural Anomaly Engine
          │
          ▼
Sequence Multi-Step Engine
          │
          ▼
ML Attack Classifier Inference
          │
          ▼
Hybrid Risk Fusion & Alert Generation
          │
          ▼
Audit Log & SOC Dashboard Stream
```

---

## 1. Safety Configuration

| Setting | Default Value | Description |
| :--- | :--- | :--- |
| `SIMULATION_ENABLED` | `false` | Disabled by default to ensure test repeatability. |
| `SIMULATION_INTERVAL_MS` | `2000` | Delay between generated events (500ms – 10000ms). |
| `SIMULATION_MODE` | `mixed` | Traffic scenario profile. |
| `MAX_LIVE_EVENTS` | `500` | Bounded circular buffer preventing memory leakage. |

---

## 2. Telemetry Scenarios

- **`normal_activity`**: Standard user logins, routine file access, normal transaction amounts adhering to user baselines.
- **`privilege_abuse`**: 5-stage insider attack chain escalating from off-hours login $\rightarrow$ privilege escalation $\rightarrow$ sensitive database access $\rightarrow$ unauthorized beneficiary creation $\rightarrow$ high-value transaction.
- **`account_takeover`**: Foreign device login $\rightarrow$ credential vault query $\rightarrow$ bulk data export.
- **`data_exfiltration`**: Standard login $\rightarrow$ sensitive PII query $\rightarrow$ bulk compressed archive download.
- **`mixed`**: 80% baseline traffic with intermittent coordinated attack chains.

---

## 3. Simulator REST API

- `GET /api/simulation/status`: Current simulation state (`running`, `paused`, `stopped`), interval, total events, alerts triggered.
- `POST /api/simulation/start`: Starts asynchronous background event stream (`mode`, `interval_ms`).
- `POST /api/simulation/pause`: Temporarily pauses event generation.
- `POST /api/simulation/stop`: Stops simulation runner.
- `POST /api/simulation/reset`: Stops runner and restores clean frozen 412 baseline dataset.
- `POST /api/simulation/step`: Injects a single synthetic event (useful for demonstrations and tests).
