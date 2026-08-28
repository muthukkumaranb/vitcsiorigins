import {
  DashboardMetrics,
  Threat,
  Identity,
  RiskAssessment,
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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
  getDashboard: () => fetchJson<DashboardMetrics>('/dashboard'),
  getThreats: () => fetchJson<Threat[]>('/threats'),
  getIdentities: () => fetchJson<Identity[]>('/identities'),
  getIdentity: (userId: string) => fetchJson<Identity>(`/identities/${userId}`),
  getRisk: (userId: string) => fetchJson<RiskAssessment>(`/investigation/${userId}/risk`),
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
