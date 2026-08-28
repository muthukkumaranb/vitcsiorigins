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
  AnalystFeedback,
  MLStatus,
  SecurityIncident,
  RiskResult,
  SimulationStatus,
  ModelRegistryData,
  NarrativeResponse
} from '../types/security';

import { formatSignal } from '../utils/formatters';


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
    primary_reasons: alert.signals.map((signal) => typeof signal === 'string' ? formatSignal(signal) : (signal.description || formatSignal(signal.signal)))
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
      ml_assessment?: RiskResult['ml_assessment'];
      hybrid_risk?: RiskResult['hybrid_risk'];
      explainability_factors?: string[];
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
      context: raw.context || { status: raw.context_status === 'found' ? 'matched' : 'none', info: null },
      ml_assessment: raw.ml_assessment,
      hybrid_risk: raw.hybrid_risk,
      explainability_factors: raw.explainability_factors,
    };
  },
  getEventNarrative: (eventId: string, refresh = false): Promise<NarrativeResponse> =>
    fetchJson<NarrativeResponse>(`/api/events/${eventId}/narrative${refresh ? '?refresh=true' : ''}`),
  getIncidentNarrative: (incidentId: string, refresh = false): Promise<NarrativeResponse> =>
    fetchJson<NarrativeResponse>(`/api/incidents/${incidentId}/narrative${refresh ? '?refresh=true' : ''}`),
  getMLStatus: (): Promise<MLStatus> => fetchJson<MLStatus>('/api/ml/status'),
  getIncidents: (): Promise<SecurityIncident[]> => fetchJson<SecurityIncident[]>('/api/incidents'),
  getIncident: (incidentId: string): Promise<SecurityIncident> => fetchJson<SecurityIncident>(`/api/incidents/${incidentId}`),
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
    fetchJson<{ success: boolean; message: string }>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback)
    }),
  getSimulationStatus: (): Promise<SimulationStatus> =>
    fetchJson<SimulationStatus>('/api/simulation/status'),
  startSimulation: (mode = 'mixed', interval_ms = 2000): Promise<SimulationStatus> =>
    fetchJson<SimulationStatus>('/api/simulation/start', {
      method: 'POST',
      body: JSON.stringify({ mode, interval_ms })
    }),
  pauseSimulation: (): Promise<SimulationStatus> =>
    fetchJson<SimulationStatus>('/api/simulation/pause', { method: 'POST' }),
  stopSimulation: (): Promise<SimulationStatus> =>
    fetchJson<SimulationStatus>('/api/simulation/stop', { method: 'POST' }),
  resetSimulation: (): Promise<SimulationStatus> =>
    fetchJson<SimulationStatus>('/api/simulation/reset', { method: 'POST' }),
  stepSimulation: (mode?: string): Promise<any> =>
    fetchJson<any>('/api/simulation/step', {
      method: 'POST',
      body: JSON.stringify({ mode })
    }),
  getMLRegistry: (): Promise<ModelRegistryData> =>
    fetchJson<ModelRegistryData>('/api/ml/registry'),
  trainCandidateModel: (version?: string, description?: string): Promise<any> =>
    fetchJson<any>('/api/ml/train-candidate', {
      method: 'POST',
      body: JSON.stringify({ version, description })
    }),
  promoteModel: (version: string, override = false): Promise<any> =>
    fetchJson<any>('/api/ml/promote', {
      method: 'POST',
      body: JSON.stringify({ version, override })
    }),
  rollbackModel: (): Promise<any> =>
    fetchJson<any>('/api/ml/rollback', { method: 'POST' })
};
