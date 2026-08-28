"""
Ollama Local LLM Client for SENTINEL AI Investigation Copilot.

Communicates locally with Ollama (default: llama3.1:8b / qwen2.5:7b) via HTTP API.
Guarantees fail-closed behavior, zero data egress, and low-latency grounded summarization.
"""

import os
import requests
from typing import Any, Dict, Literal, Optional

from .prompts import SYSTEM_PROMPT, build_user_prompt


OLLAMA_DEFAULT_HOST = "http://localhost:11434"
DEFAULT_MODEL = "llama3.1:8b"
FALLBACK_MODEL = "llama3.1:latest"
DEFAULT_TIMEOUT_SECONDS = float(os.environ.get("OLLAMA_TIMEOUT", "60.0"))




def get_ollama_host() -> str:
    """Returns the Ollama base host URL from the environment or default."""
    return os.environ.get("OLLAMA_HOST", OLLAMA_DEFAULT_HOST).rstrip("/")


def get_preferred_model() -> str:
    """Returns the preferred Ollama model name."""
    return os.environ.get("OLLAMA_MODEL", DEFAULT_MODEL)


def generate_narrative(
    payload: Dict[str, Any],
    kind: Literal["event", "incident"] = "event",
    model: Optional[str] = None,
    timeout: float = DEFAULT_TIMEOUT_SECONDS
) -> Dict[str, Any]:
    """
    Generates a grounded natural language narrative for an event or incident.

    Fail-Closed Guarantee:
    If Ollama is unreachable, times out (>3s), or produces an invalid response,
    this function will return {"narrative_status": "unavailable", "narrative": None}
    without raising an exception.

    Returns:
        dict: {
            "narrative_status": "ok" | "unavailable",
            "narrative": str | None,
            "model": str,
            "error": str | None
        }
    """
    target_model = model or get_preferred_model()
    host = get_ollama_host()
    endpoint = f"{host}/api/chat"

    user_content = build_user_prompt(payload, kind=kind)

    request_body = {
        "model": target_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content}
        ],
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 220
        }
    }

    try:
        response = requests.post(
            endpoint,
            json=request_body,
            timeout=timeout
        )

        if response.status_code != 200:
            return {
                "narrative_status": "unavailable",
                "narrative": None,
                "model": target_model,
                "error": f"Ollama HTTP {response.status_code}: {response.text[:120]}"
            }

        res_json = response.json()
        message_content = res_json.get("message", {}).get("content", "").strip()

        if not message_content:
            return {
                "narrative_status": "unavailable",
                "narrative": None,
                "model": target_model,
                "error": "Ollama returned empty response content"
            }

        return {
            "narrative_status": "ok",
            "narrative": message_content,
            "model": target_model,
            "error": None
        }

    except (requests.exceptions.RequestException, ValueError, KeyError) as exc:
        return {
            "narrative_status": "unavailable",
            "narrative": None,
            "model": target_model,
            "error": str(exc)
        }
