# SENTINEL — Frontend & Backend REST API Integration Guide

This document outlines the API specifications, object schemas, and integration workflow for connecting any backend (FastAPI, Flask, Express/Node.js, Spring Boot, Go, etc.) to the **SENTINEL** Security Operations Console frontend.

---

## 1. Quick Setup & Configuration

### Environment Variables

In `sentinel-frontend/.env`:

```bash
# Enable production REST API mode (set to false)
VITE_USE_MOCK_DATA=false

# Point to your backend API base endpoint
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 2. Centralized Service Architecture

All API calls flow through `src/services/api.ts`. The UI components never make direct `fetch()` or `axios` calls to raw URLs. Switching `VITE_USE_MOCK_DATA=false` directs all React Query calls to your REST backend.

---

## 3. Required API Endpoints Specification

### 3.1 `GET /api/dashboard`
Returns top-level security posture KPIs and trust trend line.

**Response (200 OK):**
```json
{
  "behavioural_trust_score": 78,
  "behavioural_trust_trend": 8.4,
  "active_threats": 12,
  "active_threats_trend": -14.2,
  "privileged_identities": 284,
  "privileged_identities_trend": 3.1,
  "events_analyzed": 48291,
  "events_analyzed_trend": 12.8,
  "threat_severity_counts": {
    "critical": 3,
    "high": 9,
    "medium": 18,
    "low": 43
  },
  "trust_landscape": [
    { "timestamp": "00:00", "trust_score": 88, "anomaly_count": 4 },
    { "timestamp": "01:00", "trust_score": 85, "anomaly_count": 7 }
  ]
}
```

---

### 3.2 `GET /api/threats`
Returns list of active threat incidents.

**Response (200 OK):**
```json
[
  {
    "threat_id": "THR-8891",
    "user_id": "U0345",
    "user_name": "Vikram Sharma",
    "role": "Finance Operations",
    "account_type": "Employee",
    "risk_score": 91,
    "risk_level": "CRITICAL",
    "timestamp": "02:20:13",
    "primary_reasons": [
      "New Device Registration",
      "New Beneficiary Added",
      "Large Transaction (₹8.4L)"
    ],
    "recommended_action": "SUSPEND + ESCALATE",
    "status": "OPEN"
  }
]
```

---

### 3.3 `GET /api/identities`
Returns all monitored privileged identities.

---

### 3.4 `GET /api/investigation/:userId/risk`
Returns risk decomposition and factor contributions for a specific user ID.

**Response (200 OK):**
```json
{
  "user_id": "U0345",
  "risk_score": 91,
  "risk_level": "CRITICAL",
  "trust_score": 31,
  "anomaly_score": 94,
  "behaviour_score": 89,
  "sequence_score": 94,
  "financial_score": 92,
  "context_score": 86,
  "recommended_action": "SUSPEND + ESCALATE",
  "risk_factors": [
    { "name": "Transaction Deviation", "score": 24, "description": "Wire amount ₹8.4L is +342% above 30-day average", "category": "FINANCIAL" },
    { "name": "New Beneficiary", "score": 19, "description": "Beneficiary Apex Offshore Corp added 6m prior", "category": "ACCESS" }
  ]
}
```

---

### 3.5 `GET /api/investigation/:userId/sequence`
Returns chronological event chain and sequence risk score.

**Response (200 OK):**
```json
{
  "sequence_id": "SEQ-U0345-9982",
  "user_id": "U0345",
  "sequence_risk": 94,
  "start_time": "02:11:04",
  "end_time": "02:22:15",
  "summary": "Individually authorized actions formed a suspicious behavioural sequence.",
  "events": [
    { "event_id": "EVT-101", "user_id": "U0345", "timestamp": "02:11:04", "event_type": "LOGIN", "risk_level": "LOW", "description": "SSO authentication from unverified IP" },
    { "event_id": "EVT-105", "user_id": "U0345", "timestamp": "02:20:13", "event_type": "LARGE TRANSACTION", "risk_level": "CRITICAL", "description": "Wire ₹8,40,000 to Apex Offshore Corp", "amount": "₹8,40,000" }
  ]
}
```

---

### 3.6 `POST /api/response`
Executes response action (`MONITOR`, `VERIFY`, `RESTRICT`, `SUSPEND`, `ESCALATE`).

**Request Payload:**
```json
{
  "user_id": "U0345",
  "action": "SUSPEND",
  "reason": "Critical risk 91 - Unauthorized beneficiary modification",
  "analyst_id": "SOC Lead Analyst",
  "notes": "Suspended account and notified L2 incident response team."
}
```

---

### 3.7 `POST /api/feedback`
Submits analyst feedback for continuous ML model training.

**Request Payload:**
```json
{
  "incident_id": "INC-8291",
  "user_id": "U0345",
  "decision": "CONFIRMED_THREAT",
  "comment": "Confirmed unauthorized offshore beneficiary transaction.",
  "timestamp": "2026-08-28T10:31:00Z",
  "analyst": "SOC Lead Analyst"
}
```

---

## 4. CORS Configuration Note

Ensure your backend sets CORS headers:
```http
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```
