import {
  DashboardMetrics,
  Threat,
  Identity,
  RiskAssessment,
  RiskResult,
  SecurityEvent,
  BehaviourSequence,
  BaselineMetric,
  PeerComparisonMetric,
  ContextAssessment,
  RelationshipGraphData,
  AnalyticsData,
  AuditLogEntry,
  AuditEventItem,
  AuditLogResponse,
  AuditQueryParams,
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

  getRisk: async (id: string): Promise<RiskAssessment | RiskResult> => {
    await delay();
    if (id.toUpperCase() === 'U0345') {
      return HERO_RISK_ASSESSMENT;
    }
    const mockEvent = MOCK_EVENTS.find((e) => e.event_id.toUpperCase() === id.toUpperCase());
    if (mockEvent) {
      const isCritical = mockEvent.risk_level === 'CRITICAL';
      const isHigh = mockEvent.risk_level === 'HIGH';
      const score = isCritical ? 88 : isHigh ? 65 : 22;
      return {
        event_id: mockEvent.event_id,
        user_id: mockEvent.user_id,
        event: {
          event_id: mockEvent.event_id,
          user_id: mockEvent.user_id,
          timestamp: mockEvent.timestamp,
          event_type: mockEvent.event_type,
          transaction_amount: mockEvent.amount ? mockEvent.amount.replace(/[^0-9.]/g, '') : '0',
          device_id: mockEvent.location || 'DEV-CORP'
        },
        behaviour_score: isCritical ? 80 : isHigh ? 50 : 15,
        sequence_score: isCritical ? 95 : isHigh ? 70 : 20,
        context_multiplier: 1.0,
        risk_score: score,
        severity: mockEvent.risk_level as any,
        signals: [
          { signal: 'BEHAVIOURAL_ANOMALY', contribution: 40, description: mockEvent.description }
        ],
        risk_breakdown: { 'Behavioural Deviation': 40, 'Sequence Chain': 30, 'Context Multiplier': 1.0 },
        sequence: {
          chain_detected: isCritical || isHigh,
          matched_steps: [
            { step: mockEvent.event_type, event_id: mockEvent.event_id, timestamp: mockEvent.timestamp, matched: true }
          ]
        },
        context: { status: 'none', info: null }
      };

    }
    const identity = currentIdentities.find((i) => i.user_id.toUpperCase() === id.toUpperCase());
    const score = identity?.risk_score ?? 45;
    const level = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
    return {
      user_id: id,
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

  getAuditLogs: async (params?: AuditQueryParams): Promise<AuditLogResponse> => {
    await delay();
    const mockAuditItems: AuditEventItem[] = MOCK_EVENTS.map((evt) => {
      const riskScore = evt.risk_level === 'CRITICAL' ? 88 : evt.risk_level === 'HIGH' ? 68 : evt.risk_level === 'MEDIUM' ? 44 : 14;
      const severity = evt.risk_level === 'MEDIUM' ? 'MODERATE' : evt.risk_level;
      return {
        event_id: evt.event_id,
        timestamp: evt.timestamp.includes('T') ? evt.timestamp : `2026-08-28T${evt.timestamp}:00`,
        user_id: evt.user_id,
        event_type: evt.event_type.toLowerCase().replace(/\s+/g, '_'),
        risk_score: riskScore,
        severity,
        behaviour_score: Math.round(riskScore * 0.8),
        sequence_score: evt.risk_level === 'CRITICAL' ? 80 : 0,
        context: {
          status: evt.risk_level === 'LOW' ? 'found' : 'no_context_found',
          multiplier: evt.risk_level === 'LOW' ? 0.8 : 1.0,
          info: null
        },
        sequence: {
          chain_detected: evt.risk_level === 'CRITICAL',
          matched_steps: evt.risk_level === 'CRITICAL' ? [
            { step: 'UNUSUAL_LOGIN', event_id: evt.event_id, timestamp: evt.timestamp, matched: true },
            { step: 'PRIVILEGE_CHANGE', event_id: evt.event_id, timestamp: evt.timestamp, matched: true },
            { step: 'DATA_EXPORT', event_id: evt.event_id, timestamp: evt.timestamp, matched: true }
          ] : []
        },
        signals: [
          {
            signal: evt.event_type.toUpperCase().replace(/\s+/g, '_'),
            contribution: Math.round(riskScore * 0.5),
            description: evt.description
          }
        ],
        event: {
          event_id: evt.event_id,
          user_id: evt.user_id,
          timestamp: evt.timestamp,
          event_type: evt.event_type,
          location: evt.location,
          device_id: evt.device || 'DEV-MOCK',
          transaction_amount: evt.amount || '0',
          description: evt.description
        }
      };
    });

    let items = [...mockAuditItems];

    if (params?.severity) {
      const sev = params.severity.toUpperCase();
      if (sev === 'MEDIUM' || sev === 'MODERATE') {
        items = items.filter((i) => i.severity === 'MEDIUM' || i.severity === 'MODERATE');
      } else {
        items = items.filter((i) => i.severity === sev);
      }
    }
    if (params?.user_id) {
      items = items.filter((i) => i.user_id.toLowerCase().includes(params.user_id!.toLowerCase()));
    }
    if (params?.event_type) {
      items = items.filter((i) => i.event_type.toLowerCase().includes(params.event_type!.toLowerCase()));
    }

    const sortBy = params?.sort_by || 'timestamp';
    const order = params?.order || 'desc';
    const reverse = order === 'desc';

    items.sort((a, b) => {
      if (sortBy === 'risk_score') {
        return reverse ? b.risk_score - a.risk_score : a.risk_score - b.risk_score;
      }
      if (sortBy === 'severity') {
        const rank: Record<string, number> = { CRITICAL: 4, HIGH: 3, MODERATE: 2, MEDIUM: 2, LOW: 1 };
        return reverse ? rank[b.severity] - rank[a.severity] : rank[a.severity] - rank[b.severity];
      }
      if (sortBy === 'event_id') {
        return reverse ? b.event_id.localeCompare(a.event_id) : a.event_id.localeCompare(b.event_id);
      }
      return reverse ? b.timestamp.localeCompare(a.timestamp) : a.timestamp.localeCompare(b.timestamp);
    });

    const total = items.length;

    if (params?.offset !== undefined) {
      items = items.slice(params.offset);
    }
    if (params?.limit !== undefined) {
      items = items.slice(0, params.limit);
    }

    return {
      items,
      total
    };
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
