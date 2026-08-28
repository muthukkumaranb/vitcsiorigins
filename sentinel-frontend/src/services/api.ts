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
  AuditLogResponse,
  AuditQueryParams,
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
    return fetchJson<DashboardMetrics>('/api/security-analysis');
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
  getIdentities: async (): Promise<Identity[]> => {
    return fetchJson<Identity[]>('/api/identities');
  },
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
  getEvents: (userId?: string) => fetchJson<SecurityEvent[]>(userId ? `/api/events?user_id=${userId}` : '/api/events'),
  getAnalytics: () => fetchJson<AnalyticsData>('/api/analytics'),
  getAuditLogs: async (params?: AuditQueryParams): Promise<AuditLogResponse> => {
    const query = new URLSearchParams();
    if (params?.severity) query.append('severity', params.severity);
    if (params?.user_id) query.append('user_id', params.user_id);
    if (params?.event_type) query.append('event_type', params.event_type);
    if (params?.start) query.append('start', params.start);
    if (params?.end) query.append('end', params.end);
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    if (params?.offset !== undefined) query.append('offset', String(params.offset));
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.order) query.append('order', params.order);

    const queryString = query.toString();
    const endpoint = queryString ? `/api/audit?${queryString}` : '/api/audit';
    return fetchJson<AuditLogResponse>(endpoint);
  },
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
