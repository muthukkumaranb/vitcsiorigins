"""
Prompt definitions and payload sanitization for SENTINEL AI Investigation Copilot.
Enforces strict grounding, zero invention, and severity consistency.
"""

import json
from typing import Any, Dict, Literal

SYSTEM_PROMPT = (
    "You are a SOC (Security Operations Center) analyst assistant inside SENTINEL, an "
    "insider-threat detection platform. You will be given a JSON object containing risk "
    "signals that were already computed by a deterministic rule engine and a machine "
    "learning classifier — you do not calculate risk yourself.\n\n"
    "Write a concise investigation narrative for a human security analyst using ONLY the "
    "facts present in the JSON. Rules:\n"
    "- Never invent any fact (user, device, amount, timestamp) not present in the JSON.\n"
    "- Never change or contradict the given \"severity\" value.\n"
    "- If a field is null or missing, do not mention it.\n"
    "- Write 2-4 sentences of plain-English narrative: what happened and why it's risky.\n"
    "- Then a short \"Recommended next checks\" list (max 3 bullets) an analyst should "
    "verify first, derived only from the signals/sequence/ML fields given.\n"
    "- No preamble, no disclaimers, no markdown headers. Plain text only."
)


def sanitize_payload(obj: Any) -> Any:
    """
    Recursively strips any private internal fields (starting with '_') from dictionaries
    and lists to ensure no internal implementation metadata leaks to the LLM.
    """
    if isinstance(obj, dict):
        return {
            k: sanitize_payload(v)
            for k, v in obj.items()
            if not k.startswith("_")
        }
    if isinstance(obj, list):
        return [sanitize_payload(item) for item in obj]
    return obj


def build_user_prompt(payload: Dict[str, Any], kind: Literal["event", "incident"] = "event") -> str:
    """
    Builds the sanitized user message JSON for the Ollama chat prompt.
    """
    clean_data = sanitize_payload(payload)
    prompt_obj = {
        "kind": kind,
        "data": clean_data
    }
    return json.dumps(prompt_obj, indent=2)
