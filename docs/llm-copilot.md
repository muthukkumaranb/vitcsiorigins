# SENTINEL AI Investigation Copilot (Local Ollama)

## 1. Overview & Architecture

The **SENTINEL AI Investigation Copilot** provides an on-demand, natural-language narrative synthesis layer for SOC security analysts. Running entirely on local hardware via **Ollama**, it synthesizes human-readable incident and event briefings with recommended investigation actions directly from SENTINEL's deterministic rules, attack sequence trackers, context evaluators, and machine learning classifiers.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SOC Console (React)                           │
│  [ Generate AI Summary ] ───►  Grounded Narrative + Next SOC Checks     │
│                                (Raw Explainability Bullets Preserved)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (On-Demand HTTP)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Flask API (Backend)                           │
│  GET /api/events/<event_id>/narrative  |  GET /api/incidents/<id>/narrative│
│  ├─ In-Memory Cache (keyed by ID & Risk Fingerprint)                    │
│  ├─ Fail-Closed Guard (3.0s Timeout, Network / JSON Catchers)            │
│  └─ Grounding Sanitizer (strips private internal '_' fields)            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Local Zero-Egress HTTP: 11434)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Local Ollama Inference Engine                      │
│            Model: llama3.1:8b (Fallback: qwen2.5:7b)                   │
│            Target Hardware: NVIDIA RTX 4070 (8GB VRAM) / Apple Silicon  │
│            Parameters: temperature=0.2, num_predict=220                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Hard Constraints & Security Guarantees

1. **Zero Data Egress / Local-Only Privacy**: All LLM communications are strictly constrained to `http://localhost:11434` (configurable via `OLLAMA_HOST`). No event data, identifiers, or tokens leave the local network.
2. **Strict Grounding (Zero Hallucination)**: The LLM prompt is strictly instructed to only reference facts explicitly provided in the computed JSON payload. If a field is null or missing, it is omitted rather than guessed.
3. **Deterministic Severity Alignment**: The copilot strictly adheres to the severity (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`) already computed by SENTINEL's rule engine. The LLM explains and prioritizes—it never alters or recalculates scores.
4. **Scoring Math Non-Interference**: Core scoring in `backend/processor.py` and `backend/ml/` remains fast, synchronous, and purely deterministic. Narrative generation is decoupled and executed only on analyst request.
5. **Fail-Closed Resilience**: If Ollama is offline, unreachable, or exceeds its 3-second latency budget, the API returns `"narrative_status": "unavailable"` and the frontend displays the raw `explainability_factors` bullet list without interrupting workflow.

---

## 3. Hardware & Model Configuration

| Parameter | Configuration |
| :--- | :--- |
| **Primary Model** | `llama3.1:8b` (Q4_K_M ~4.7 GB VRAM) |
| **Fallback Model** | `qwen2.5:7b` (Q4_K_M ~4.4 GB VRAM) |
| **Target GPU** | NVIDIA RTX 4070 (8GB VRAM) or comparable |
| **Inference Latency** | < 2.5s typical response time |
| **Sampling Temperature** | `0.2` (low temperature for grounded factual summaries) |
| **Token Budget (`num_predict`)** | `220` tokens (concise 2-4 sentence narrative + 3 action bullets) |

---

## 4. API Endpoints

### 4.1 Event Investigation Narrative
```http
GET /api/events/{event_id}/narrative
```
**Query Parameters:**
- `refresh=true` (optional): Bypass in-memory cache and re-run Ollama inference.

**Response (`200 OK` - Success):**
```json
{
  "event_id": "E0408",
  "narrative": "User U0042 engaged in high-risk activity involving a full 5-stage insider attack sequence that culminated in a DATA_EXPORT event. The activity deviated from historical baselines with an active ML malicious probability of 87% and no matched authorizing context.\n\nRecommended next checks:\n• Validate integrity of the exported data repository\n• Review endpoint device authentication logs for user U0042\n• Contact supervisor to verify absence of operational ticket",
  "narrative_status": "ok",
  "model": "llama3.1:8b",
  "cached": false,
  "error": null
}
```

**Response (`200 OK` - Graceful Offline Fallback):**
```json
{
  "event_id": "E0408",
  "narrative": null,
  "narrative_status": "unavailable",
  "model": "llama3.1:8b",
  "cached": false,
  "error": "Connection refused to localhost:11434"
}
```

### 4.2 Multi-Stage Incident Narrative
```http
GET /api/incidents/{incident_id}/narrative
```

---

## 5. Setup & Verification

### Step 1: Install & Pull Model
```bash
ollama pull llama3.1:8b
ollama serve
```

### Step 2: Test API Connectivity
```bash
curl -X GET http://127.0.0.1:5000/api/events/E0408/narrative
```

### Step 3: Run Automated Test Suite
```bash
pytest backend/tests/test_llm_copilot.py
```
