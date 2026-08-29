"""
Ollama Local LLM Client for SENTINEL AI Investigation Copilot.

Communicates locally with Ollama (default: llama3.1:8b / llama3.1 / qwen2.5:7b) via HTTP API.
Guarantees fail-closed behavior, zero data egress, bounded fail-fast timeouts, and low-latency grounded summarization.
"""

import os
import time
import requests
from typing import Any, Dict, Literal, Optional, Tuple, Union

from .prompts import SYSTEM_PROMPT, build_user_prompt


OLLAMA_DEFAULT_HOST = "http://localhost:11434"
DEFAULT_MODEL = "llama3.1:8b"
FALLBACK_MODEL = "llama3.1:latest"
DEFAULT_CONNECT_TIMEOUT = 1.5
DEFAULT_READ_TIMEOUT = float(os.environ.get("OLLAMA_TIMEOUT", "6.0"))

_HEALTH_CACHE: Dict[str, Any] = {"status": None, "timestamp": 0.0, "data": None}
_HEALTH_CACHE_TTL_SECONDS = 15.0


def get_ollama_host() -> str:
    """Returns the Ollama base host URL from the environment or default."""
    return os.environ.get("OLLAMA_HOST", OLLAMA_DEFAULT_HOST).rstrip("/")


def get_preferred_model() -> str:
    """Returns the preferred Ollama model name."""
    return os.environ.get("OLLAMA_MODEL", DEFAULT_MODEL)


def check_ollama_health(force: bool = False) -> Dict[str, Any]:
    """
    Lightweight, fast health check against local Ollama service.
    Queries /api/tags with a strict 1.5s timeout. Caches response for 15 seconds.
    """
    global _HEALTH_CACHE
    now = time.time()
    if not force and _HEALTH_CACHE["data"] and (now - _HEALTH_CACHE["timestamp"]) < _HEALTH_CACHE_TTL_SECONDS:
        return _HEALTH_CACHE["data"]

    host = get_ollama_host()
    target_model = get_preferred_model()
    try:
        resp = requests.get(f"{host}/api/tags", timeout=(1.0, 1.5))
        if resp.status_code == 200:
            models_data = resp.json().get("models", [])
            model_names = [m.get("name", "") for m in models_data]
            has_model = any(
                target_model in name or name.startswith("llama3.1") or name.startswith("qwen")
                for name in model_names
            )
            result = {
                "status": "ready" if has_model else "model_unavailable",
                "available": True,
                "preferred_model": target_model,
                "installed_models": model_names,
                "host": host,
            }
        else:
            result = {
                "status": "unavailable",
                "available": False,
                "preferred_model": target_model,
                "installed_models": [],
                "host": host,
                "error": f"Ollama HTTP {resp.status_code}",
            }
    except Exception as exc:
        result = {
            "status": "unavailable",
            "available": False,
            "preferred_model": target_model,
            "installed_models": [],
            "host": host,
            "error": str(exc),
        }

    _HEALTH_CACHE = {"timestamp": now, "data": result}
    return result


def generate_narrative(
    payload: Dict[str, Any],
    kind: Literal["event", "incident"] = "event",
    model: Optional[str] = None,
    timeout: Union[float, Tuple[float, float]] = DEFAULT_READ_TIMEOUT,
) -> Dict[str, Any]:
    """
    Generates a grounded natural language narrative for an event or incident.

    Fail-Closed Guarantee:
    If Ollama is unreachable, times out, or produces an invalid response,
    this function will return {"narrative_status": "unavailable", "narrative": None}
    without raising an exception or hanging.

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

    req_timeout = timeout if isinstance(timeout, tuple) else (DEFAULT_CONNECT_TIMEOUT, float(timeout))

    try:
        response = requests.post(
            endpoint,
            json=request_body,
            timeout=req_timeout
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
