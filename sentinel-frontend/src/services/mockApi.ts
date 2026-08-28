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

import {
  MOCK_IDENTITIES,
  HERO_RISK_ASSESSMENT,
  HERO_BASELINE_METRICS,
  HERO_PEER_COMPARISON,
  HERO_SEQUENCE,
  HERO_CONTEXT,
  HERO_RELATIONSHIP_GRAPH,
  MOCK_THREATS,
  MOCK_EVENTS,
  MOCK_DASHBOARD_METRICS,
  MOCK_AUDIT_LOGS,
  MOCK_ANALYTICS
} from '../data/mockData';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

let currentIdentities = [...MOCK_IDENTITIES];
let currentThreats = [...MOCK_THREATS];
let currentAuditLogs = [...MOCK_AUDIT_LOGS];

export const mockApiService = {
  getDashboard: async (): Promise<DashboardMetrics> => {
    await delay();
    return { ...MOCK_DASHBOARD_METRICS };
  },

  getThreats: async (): Promise<Threat[]> => {
    await delay();
    return [...currentThreats];
  },

  getIdentities: async (): Promise<Identity[]> => {
    await delay();
    return [...currentIdentities];
  },

  getIdentity: async (userId: string): Promise<Identity> => {
    await delay();
    const found = currentIdentities.find((i) => i.user_id.toLowerCase() === userId.toLowerCase());
    if (found) return found;
    // Fallback default mock identity if unknown user requested
    return {
      user_id: userId,
      name: `User ${userId}`,
      account_type: 'Employee',
      role: 'Operations Specialist',
      department: 'Enterprise Systems',
      privilege_level: 'MEDIUM',
      peer_group: 'General Staff',
      trust_score: 75,
      risk_score: 25,
      status: 'ACTIVE',
      last_activity: 'Just now',
      normal_hours: '09:00 - 18:00 IST'
    };
  },

  getRisk: async (userId: string): Promise<RiskAssessment> => {
    await delay();
    if (userId.toUpperCase() === 'U0345') {
      return HERO_RISK_ASSESSMENT;
    }
    const identity = currentIdentities.find((i) => i.user_id.toUpperCase() === userId.toUpperCase());
    const score = identity?.risk_score ?? 45;
    const level = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
    return {
      user_id: userId,
      risk_score: score,
      risk_level: level,
      trust_score: identity?.trust_score ?? 60,
      anomaly_score: score + 3,
      behaviour_score: score - 2,
      sequence_score: score - 5,
      financial_score: score > 70 ? 80 : 30,
      context_score: score > 70 ? 75 : 20,
      recommended_action: score >= 80 ? 'SUSPEND + ESCALATE' : score >= 60 ? 'RESTRICT' : 'MONITOR',
      risk_factors: [
        { name: 'Access Frequency', score: Math.round(score * 0.4), description: 'Elevated API activity rate', category: 'ACCESS' },
        { name: 'After-hours Login', score: Math.round(score * 0.3), description: 'Session outside core business window', category: 'TIMING' }
      ]
    };
  },

  getBaseline: async (userId: string): Promise<BaselineMetric[]> => {
    await delay();
    if (userId.toUpperCase() === 'U0345') {
      return HERO_BASELINE_METRICS;
    }
    return [
      { metric: 'Transactions / Day', normal_value: 10, current_value: 14, unit: 'tx', deviation_percentage: 40, is_anomalous: false },
      { metric: 'Average Transaction Amount', normal_value: '₹1.5L', current_value: '₹2.1L', unit: 'INR', deviation_percentage: 40, is_anomalous: false },
      { metric: 'Data Records Exported', normal_value: 30, current_value: 45, unit: 'records', deviation_percentage: 50, is_anomalous: false }
    ];
  },

  getPeerAnalysis: async (userId: string): Promise<PeerComparisonMetric[]> => {
    await delay();
    if (userId.toUpperCase() === 'U0345') {
      return HERO_PEER_COMPARISON;
    }
    return [
      { metric: 'Transactions / Day', user_value: 14, peer_median: 12, unit: 'tx', variance: '+16% vs Peer Median', is_outlier: false },
      { metric: 'Avg Transaction Amount', user_value: '₹2.1L', peer_median: '₹1.9L', unit: 'INR', variance: '+10% vs Peer Median', is_outlier: false }
    ];
  },

  getSequence: async (userId: string): Promise<BehaviourSequence> => {
    await delay();
    if (userId.toUpperCase() === 'U0345') {
      return HERO_SEQUENCE;
    }
    return {
      sequence_id: `SEQ-${userId}`,
      user_id: userId,
      sequence_risk: 42,
      start_time: '09:00:00',
      end_time: '12:30:00',
      summary: 'Standard operational action sequence recorded.',
      events: MOCK_EVENTS.slice(0, 3)
    };
  },

  getContext: async (userId: string): Promise<ContextAssessment> => {
    await delay();
    if (userId.toUpperCase() === 'U0345') {
      return HERO_CONTEXT;
    }
    return {
      authorization: 'AUTHORIZED',
      behaviour: 'NORMAL',
      peer_pattern: 'TYPICAL',
      business_exception: false,
      maintenance_window: false,
      historical_risk: 'LOW',
      incident_ticket: false,
      context_risk: 'LOW'
    };
  },

  getRelationshipGraph: async (userId: string): Promise<RelationshipGraphData> => {
    await delay();
    if (userId.toUpperCase() === 'U0345') {
      return HERO_RELATIONSHIP_GRAPH;
    }
    return {
      nodes: [
        { id: userId, label: `User (${userId})`, type: 'USER', risk: 'LOW' },
        { id: 'ACC-01', label: 'Primary Operating AC', type: 'ACCOUNT', risk: 'LOW' },
        { id: 'DEV-01', label: 'Authorized Laptop', type: 'DEVICE', risk: 'LOW' }
      ],
      links: [
        { source: userId, target: 'ACC-01', label: 'Standard Access' },
        { source: userId, target: 'DEV-01', label: 'Active Session' }
      ]
    };
  },

  getEvents: async (userId?: string): Promise<SecurityEvent[]> => {
    await delay();
    if (userId) {
      return MOCK_EVENTS.filter((e) => e.user_id.toUpperCase() === userId.toUpperCase());
    }
    return [...MOCK_EVENTS];
  },

  getAnalytics: async (): Promise<AnalyticsData> => {
    await delay();
    return { ...MOCK_ANALYTICS };
  },

  getAuditLogs: async (): Promise<AuditLogEntry[]> => {
    await delay();
    return [...currentAuditLogs];
  },

  executeResponse: async (payload: ResponseActionPayload) => {
    await delay(300);
    const newAuditEntry: AuditLogEntry = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      analyst: payload.analyst_id || 'SOC Analyst Admin',
      identity_id: payload.user_id,
      action: payload.action,
      reason: payload.reason,
      result: 'Completed',
      details: payload.notes || `Response action ${payload.action} enforced on target ${payload.user_id}.`
    };

    currentAuditLogs.unshift(newAuditEntry);

    // Update status of identity
    currentIdentities = currentIdentities.map((id) => {
      if (id.user_id.toUpperCase() === payload.user_id.toUpperCase()) {
        const newStatus = payload.action === 'SUSPEND' || payload.action === 'ESCALATE'
          ? 'SUSPENDED'
          : payload.action === 'RESTRICT'
          ? 'RESTRICTED'
          : 'MONITORED';
        return { ...id, status: newStatus };
      }
      return id;
    });

    return {
      success: true,
      message: `Action ${payload.action} successfully enforced for identity ${payload.user_id}`,
      audit_entry: newAuditEntry
    };
  },

  submitFeedback: async (feedback: AnalystFeedback) => {
    await delay(300);
    const auditEntry: AuditLogEntry = {
      id: `AUD-FB-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      analyst: feedback.analyst || 'SOC Analyst',
      identity_id: feedback.user_id,
      action: `FEEDBACK: ${feedback.decision}`,
      reason: feedback.comment || 'Analyst decision recorded for continuous ML feedback loop.',
      result: 'Completed'
    };

    currentAuditLogs.unshift(auditEntry);

    return {
      success: true,
      message: 'Analyst feedback successfully recorded. Model continuous baseline updated.'
    };
  }
};
