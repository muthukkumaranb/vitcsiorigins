"""
SENTINEL Hybrid Risk Fusion Module.

Fuses deterministic behavioral signals, sequence intelligence, operational context,
and machine learning attack probabilities into a unified hybrid risk assessment.
"""


def calculate_deterministic_risk(behaviour_score, sequence_score, context_multiplier=1.0):
    """
    Deterministic v1 Risk Formula:
        clamp((behaviour_score * 0.60 + sequence_score * 0.40) * context_multiplier, 0, 100)
    """
    raw = (behaviour_score * 0.60 + sequence_score * 0.40) * context_multiplier
    return round(min(100.0, max(0.0, raw)), 2)


def calculate_hybrid_risk(behaviour_score, sequence_score, ml_attack_probability, context_multiplier=1.0):
    """
    Hybrid Risk Fusion Formula:
        If ML is available:
            ml_component = ml_attack_probability * 100
            hybrid = clamp((behaviour * 0.45 + sequence * 0.30 + ml_component * 0.25) * context_multiplier, 0, 100)
        If ML is unavailable (None):
            falls back to deterministic v1 formula
    """
    if ml_attack_probability is None:
        score = calculate_deterministic_risk(behaviour_score, sequence_score, context_multiplier)
        return {
            "hybrid_score": score,
            "fusion_mode": "deterministic_fallback",
            "weights": {"behaviour": 0.60, "sequence": 0.40, "ml": 0.0},
            "formula": "clamp((behaviour * 0.60 + sequence * 0.40) * context, 0, 100)",
        }

    ml_component = float(ml_attack_probability) * 100.0
    raw = (behaviour_score * 0.45 + sequence_score * 0.30 + ml_component * 0.25) * context_multiplier
    score = round(min(100.0, max(0.0, raw)), 2)
    return {
        "hybrid_score": score,
        "fusion_mode": "hybrid_fusion_v1",
        "weights": {"behaviour": 0.45, "sequence": 0.30, "ml": 0.25},
        "formula": "clamp((behaviour * 0.45 + sequence * 0.30 + (ml_probability * 100) * 0.25) * context, 0, 100)",
    }


def classify_severity(score):
    if score >= 75.0:
        return "CRITICAL"
    if score >= 50.0:
        return "HIGH"
    if score >= 25.0:
        return "MODERATE"
    return "LOW"


def generate_explainability_summary(behaviour_signals, sequence_data, context_data, ml_assessment):
    """
    Generates human-readable SOC explanation bullet points for an event.
    """
    factors = []

    # 1. Behavioural factors
    for s in (behaviour_signals or []):
        desc = s.get("description") or s.get("signal")
        contrib = s.get("contribution", 0)
        factors.append(f"{desc} (+{contrib} pts)")

    # 2. Sequence factor
    if sequence_data and sequence_data.get("chain_detected"):
        steps_count = len(sequence_data.get("matched_steps", []))
        factors.append(f"Attack Chain Detected: {steps_count}-stage sequence matched in 60-min window.")

    # 3. Context factor
    status = (context_data or {}).get("status")
    if status == "matched" or status == "found" or status == "approved":
        factors.append("Approved Operational Context: Risk suppressed by 0.8x multiplier.")
    elif status == "ambiguous":
        factors.append("Ambiguous Context: Multiple overlapping tickets; suppression withheld.")

    # 4. ML factor
    if ml_assessment and ml_assessment.get("status") == "active":
        prob = ml_assessment.get("attack_probability")
        if prob is not None and prob >= 0.5:
            pct = int(prob * 100)
            factors.append(f"ML Classifier Indicator: Model estimates {pct}% malicious probability.")

    if not factors:
        factors.append("Baseline Activity: No anomalous behavioral deviation detected.")

    return factors
