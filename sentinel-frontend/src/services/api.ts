import {
  DashboardMetrics,
  Threat,
  Identity,
  SecurityEvent,
  BehaviourSequence,
  BaselineMetric,
  PeerComparisonMetric,
  ContextAssessment,
  RelationshipGraphData,
  AnalyticsData,
  AuditLogEntry,
  ResponseActionPayload,
  AnalystFeedback
} from '../types/security';
import { RiskResult } from '../types/security';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const apiService = {
  getDashboard: async (): Promise<DashboardMetrics> => {
    const [health, alerts, identities] = await Promise.all([
      fetchJson<{ events: number }>('/api/health'),
      fetchJson<Array<{ risk_score: number; severity: string }>>('/api/alerts'),
      fetchJson<Identity[]>('/api/identities')
    ]);
    const trust = alerts.length ? Math.round(100 - alerts.reduce((sum, alert) => sum + alert.risk_score, 0) / alerts.length) : 100;
    return {
      behavioural_trust_score: trust,
      behavioural_trust_trend: 0,
      active_threats: alerts.length,
      active_threats_trend: 0,
      privileged_identities: identities.length,
      privileged_identities_trend: 0,
      events_analyzed: health.events,
      events_analyzed_trend: 0,
      threat_severity_counts: {
        critical: alerts.filter((alert) => alert.severity === 'CRITICAL').length,
        high: alerts.filter((alert) => alert.severity === 'HIGH').length,
        medium: alerts.filter((alert) => alert.severity === 'MODERATE').length,
        low: 0
      },
      trust_landscape: []
    };
  },
  getThreats: async (): Promise<Threat[]> => (await fetchJson<Array<{ alert_id: string; event_id: string; user_id: string; risk_score: number; severity: RiskResult['severity']; timestamp: string; signals: Array<string | { signal: string; description?: string }> }>>('/api/alerts')).map((alert) => ({
    threat_id: alert.alert_id,
    event_id: alert.event_id,
    user_id: alert.user_id,
    risk_score: alert.risk_score,
    risk_level: alert.severity,
    timestamp: alert.timestamp,
    primary_reasons: alert.signals.map((signal) => typeof signal === 'string' ? signal : signal.signal)
  })),
  getIdentities: async (): Promise<Identity[]> => (await fetchJson<Array<Record<string, string>>>('/api/identities')).map((identity) => ({
    user_id: identity.user_id,
    name: identity.user_id,
    account_type: identity.actor_type === 'service_account' ? 'Service Account' : identity.actor_type === 'automated_system' ? 'Automated System' : 'Employee',
    role: identity.role,
    department: undefined,
    privilege_level: 'NOT_AVAILABLE',
    peer_group: identity.peer_group_id,
    last_activity: undefined,
    normal_hours: identity.typical_login_hour,
    normal_location: identity.home_device
  })),
  getIdentity: (userId: string) => fetchJson<Identity>(`/api/identities/${userId}`),
  getRisk: async (eventId: string): Promise<RiskResult> => {
    const raw = await fetchJson<{
      event_id: string;
      user_id: string;
      behaviour_score: number;
      sequence_score: number;
      context_multiplier: number;
      risk_score: number;
      severity: RiskResult['severity'];
      signals: Array<{ signal: string; contribution: number; description: string }>;
      context_status: string;
      event?: Record<string, string>;
      sequence?: RiskResult['sequence'];
      context?: RiskResult['context'];
    }>(`/api/events/${eventId}/risk/`);
    return {
      event_id: raw.event_id,
      user_id: raw.user_id,
      event: raw.event || {},
      behaviour_score: raw.behaviour_score,
      sequence_score: raw.sequence_score,
      context_multiplier: raw.context_multiplier,
      risk_score: raw.risk_score,
      severity: raw.severity,
      signals: raw.signals || [],
      risk_breakdown: {},
      sequence: raw.sequence || { chain_detected: false, matched_steps: [] },
      context: raw.context || { status: raw.context_status === 'found' ? 'matched' : 'none', info: null }
    };
  },
  getBaseline: (userId: string) => fetchJson<BaselineMetric[]>(`/investigation/${userId}/baseline`),
  getPeerAnalysis: (userId: string) => fetchJson<PeerComparisonMetric[]>(`/investigation/${userId}/peer`),
  getSequence: (userId: string) => fetchJson<BehaviourSequence>(`/investigation/${userId}/sequence`),
  getContext: (userId: string) => fetchJson<ContextAssessment>(`/investigation/${userId}/context`),
  getRelationshipGraph: (userId: string) => fetchJson<RelationshipGraphData>(`/investigation/${userId}/graph`),
  getEvents: (userId?: string) => fetchJson<SecurityEvent[]>(userId ? `/events?user_id=${userId}` : '/events'),
  getAnalytics: () => fetchJson<AnalyticsData>('/analytics'),
  getAuditLogs: () => fetchJson<AuditLogEntry[]>('/audit'),
  executeResponse: (payload: ResponseActionPayload) =>
    fetchJson<{ success: boolean; message: string; audit_entry: AuditLogEntry }>('/response', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  submitFeedback: (feedback: AnalystFeedback) =>
    fetchJson<{ success: boolean; message: string }>('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback)
    })
};
