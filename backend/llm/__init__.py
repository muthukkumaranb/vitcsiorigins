"""
SENTINEL AI Investigation Copilot LLM Integration Module.
"""

from .ollama_client import generate_narrative, get_ollama_host, get_preferred_model, check_ollama_health
from .prompts import SYSTEM_PROMPT, build_user_prompt, sanitize_payload

__all__ = [
    "generate_narrative",
    "get_ollama_host",
    "get_preferred_model",
    "check_ollama_health",
    "SYSTEM_PROMPT",
    "build_user_prompt",
    "sanitize_payload",
]
