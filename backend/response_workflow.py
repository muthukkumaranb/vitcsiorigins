"""Analyst-approved response workflow for detected events."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import RLock
from typing import Callable, Optional
from uuid import uuid4

try:
    from .processor import EventNotFoundError, process_event
except ImportError:
    from processor import EventNotFoundError, process_event

RECOMMENDED = "RECOMMENDED"
APPROVED = "APPROVED"
REJECTED = "REJECTED"
EXECUTED = "EXECUTED"
FAILED = "FAILED"

APPROVE = "APPROVE"
REJECT = "REJECT"
EXECUTE = "EXECUTE"
MVP_ANALYST = "mvp-analyst"

_ALLOWED_TRANSITIONS = {
    RECOMMENDED: {APPROVED, REJECTED},
    APPROVED: {EXECUTED, FAILED},
    REJECTED: set(),
    EXECUTED: set(),
    FAILED: set(),
}


class InvalidTransitionError(Exception):
    """Raised when a response decision is not valid for its current state."""


class AuditSink:
    """Small integration boundary for the persistent audit implementation."""

    def record(self, event_type, response):
        return None


@dataclass
class ResponseRecord:
    response_id: str
    event_id: str
    user_id: Optional[str]
    risk_score: float
    severity: str
    recommended_action: str
    recommended_actions: list
    recommendation_reason: str
    risk_explanation: dict
    recommendation_priority: str
    state: str = RECOMMENDED
    actor: Optional[str] = None
    created_at: str = field(default_factory=lambda: _utc_now())
    updated_at: str = field(default_factory=lambda: _utc_now())
    decided_at: Optional[str] = None
    executed_at: Optional[str] = None
    execution_status: str = "NOT_EXECUTED"
    execution_information: Optional[str] = None

    def to_public(self):
        return {
            "response_id": self.response_id,
            "event_id": self.event_id,
            "user_id": self.user_id,
            "risk_score": self.risk_score,
            "severity": self.severity,
            "recommended_action": self.recommended_action,
            "recommended_actions": self.recommended_actions,
            "recommendation_reason": self.recommendation_reason,
            "risk_explanation": self.risk_explanation,
            "recommendation_priority": self.recommendation_priority,
            "state": self.state,
            "actor": self.actor,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "decided_at": self.decided_at,
            "executed_at": self.executed_at,
            "execution_status": self.execution_status,
            "execution_information": self.execution_information,
            "execution_mode": "SIMULATED",
        }


def _utc_now():
    return datetime.now(timezone.utc).isoformat()


def recommend_response(risk_result):
    """Build a response recommendation from the existing risk result."""
    severity = risk_result["severity"]
    policies = {
        "LOW": ("MONITOR", ["MONITOR"], "Routine monitoring is appropriate for this low-risk event.", "LOW"),
        "MODERATE": ("INCREASE_MONITORING", ["INCREASE_MONITORING", "ANALYST_REVIEW"], "The moderate risk warrants increased monitoring and analyst review.", "MEDIUM"),
        "HIGH": ("RECOMMEND_SESSION_TERMINATION", ["RECOMMEND_SESSION_TERMINATION", "RECOMMEND_TEMPORARY_ACCESS_RESTRICTION"], "The high risk warrants analyst consideration of session termination and temporary access restriction.", "HIGH"),
        "CRITICAL": ("RECOMMEND_ACCOUNT_SESSION_CONTAINMENT", ["RECOMMEND_ACCOUNT_SESSION_CONTAINMENT"], "The critical risk warrants analyst consideration of account and session containment.", "CRITICAL"),
    }
    action, actions, reason, priority = policies.get(severity, policies["LOW"])
    return {
        "recommended_action": action,
        "recommended_actions": actions,
        "recommendation_reason": reason,
        "recommendation_priority": priority,
        "risk_score": risk_result["risk_score"],
        "severity": severity,
    }


class ResponseWorkflow:
    def __init__(self, audit_sink=None, executor=None):
        self._records = {}
        self._lock = RLock()
        self.audit_sink = audit_sink or AuditSink()
        self.executor = executor or (lambda record: True)

    def get_or_create(self, event_id):
        with self._lock:
            if event_id in self._records:
                return self._records[event_id]
            risk_result = process_event(event_id)
            recommendation = recommend_response(risk_result)
            recommendation["risk_explanation"] = {
                "signals": risk_result.get("signals", []),
                "sequence": risk_result.get("sequence", {}),
                "context": risk_result.get("context", {}),
            }
            record = ResponseRecord(
                response_id=f"RESP-{event_id}",
                event_id=event_id,
                user_id=risk_result.get("user_id"),
                **recommendation,
            )
            self._records[event_id] = record
            self.audit_sink.record("RESPONSE_RECOMMENDED", record.to_public())
            return record

    def decide(self, event_id, decision, actor=MVP_ANALYST):
        if decision not in {APPROVE, REJECT, EXECUTE}:
            raise ValueError("decision must be APPROVE, REJECT, or EXECUTE")
        record = self.get_or_create(event_id)
        target = {APPROVE: APPROVED, REJECT: REJECTED, EXECUTE: EXECUTED}[decision]
        if target == EXECUTED:
            return self.execute(event_id, actor)
        with self._lock:
            self._transition(record, target)
            now = _utc_now()
            record.actor = actor
            record.decided_at = now
            record.updated_at = now
            self.audit_sink.record(f"RESPONSE_{target}", record.to_public())
            return record

    def execute(self, event_id, actor=MVP_ANALYST):
        record = self.get_or_create(event_id)
        with self._lock:
            if EXECUTED not in _ALLOWED_TRANSITIONS.get(record.state, set()):
                raise InvalidTransitionError(f"Cannot execute response in state {record.state}")
            now = _utc_now()
            record.actor = actor
            record.executed_at = now
            record.updated_at = now
            try:
                succeeded = bool(self.executor(record))
            except Exception:
                succeeded = False
            if succeeded:
                self._transition(record, EXECUTED)
                record.execution_status = "SIMULATED_SUCCESS"
                record.execution_information = "Simulated response execution; no real security action was performed."
                self.audit_sink.record("RESPONSE_EXECUTED", record.to_public())
            else:
                self._transition(record, FAILED)
                record.execution_status = "SIMULATED_FAILURE"
                record.execution_information = "Simulated response execution failed; no real security action was performed."
                self.audit_sink.record("RESPONSE_FAILED", record.to_public())
            return record

    @staticmethod
    def _transition(record, target):
        if target not in _ALLOWED_TRANSITIONS.get(record.state, set()):
            raise InvalidTransitionError(f"Cannot transition response from {record.state} to {target}")
        record.state = target

    def clear(self):
        with self._lock:
            self._records.clear()


workflow = ResponseWorkflow()
