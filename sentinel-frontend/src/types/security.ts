export type RiskLevel = 'LOW' | 'MEDIUM' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type AccountType = 'Employee' | 'Administrator' | 'Service Account' | 'Automated System';
export type PrivilegeLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'SYSTEM_ADMIN' | 'NOT_AVAILABLE';
export type IdentityStatus = 'ACTIVE' | 'MONITORED' | 'RESTRICTED' | 'SUSPENDED' | 'UNDER_INVESTIGATION' | 'CRITICAL';

export interface Identity {
  user_id: string;
  name?: string;
  account_type: AccountType;
  role: string;
  department?: string;
  privilege_level: PrivilegeLevel;
  peer_group: string;
  trust_score?: number; // 0 - 100
  risk_score?: number;  // 0 - 100
  status?: IdentityStatus;
  last_activity?: string;
  avatar_url?: string;
  normal_hours?: string;
  normal_location?: string;
}

export interface RiskFactor {
  name: string;
  score: number;
  description: string;
  category: 'FINANCIAL' | 'DEVICE' | 'PRIVILEGE' | 'TIMING' | 'SEQUENCE' | 'ACCESS';
}

export interface RiskAssessment {
  user_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  trust_score: number;
  anomaly_score: number;
  behaviour_score: number;
  sequence_score: number;
  financial_score: number;
  context_score: number;
  recommended_action: 'MONITOR' | 'VERIFY' | 'RESTRICT' | 'SUSPEND' | 'SUSPEND + ESCALATE';
  risk_factors: RiskFactor[];
}

export interface BehaviourSignal {
  signal: string;
  contribution: number;
  description: string;
}

export interface SequenceResult {
  chain_detected: boolean;
  matched_steps: Array<{ step: string; event_id: string; timestamp: string; matched: boolean }>;
}

export interface ContextResult {
  status: 'none' | 'matched' | 'ambiguous';
  info: { context_id: string; type: string; manager_approval: boolean } | null;
}

export interface RiskResult {
  event_id: string;
  user_id: string;
  event: Record<string, string>;
  behaviour_score: number;
  sequence_score: number;
  context_multiplier: number;
  risk_score: number;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  signals: BehaviourSignal[];
  risk_breakdown: Record<string, number>;
  sequence: SequenceResult;
  context: ContextResult;
}

export interface SecurityEvent {
  event_id: string;
  user_id: string;
  user_name?: string;
  timestamp: string;
  event_type: string;
  risk_level: RiskLevel;
  description: string;
  amount?: string;
  location?: string;
  device?: string;
  ip_address?: string;
  details?: Record<string, any>;
}

export interface BehaviourSequence {
  sequence_id: string;
  user_id: string;
  sequence_risk: number; // 0 - 100
  start_time: string;
  end_time: string;
  summary: string;
  events: SecurityEvent[];
}

export interface BaselineMetric {
  metric: string;
  normal_value: string | number;
  current_value: string | number;
  unit?: string;
  deviation_percentage: number;
  is_anomalous: boolean;
}

export interface PeerComparisonMetric {
  metric: string;
  user_value: string | number;
  peer_median: string | number;
  unit?: string;
  variance: string;
  is_outlier: boolean;
}

export interface ContextAssessment {
  authorization: 'AUTHORIZED' | 'UNAUTHORIZED' | 'EXPIRED';
  behaviour: 'NORMAL' | 'DEVIANT' | 'CRITICAL_ANOMALY';
  peer_pattern: 'TYPICAL' | 'UNUSUAL' | 'EXTREME_OUTLIER';
  business_exception: boolean;
  maintenance_window: boolean;
  historical_risk: 'LOW' | 'MODERATE' | 'HIGH';
  incident_ticket: boolean;
  context_risk: RiskLevel;
}

export interface RelationshipNode {
  id: string;
  label: string;
  type: 'USER' | 'BENEFICIARY' | 'ACCOUNT' | 'DEVICE' | 'PRIVILEGE' | 'RESOURCE';
  risk?: RiskLevel;
  details?: string;
}

export interface RelationshipLink {
  source: string;
  target: string;
  label?: string;
  isAnomalous?: boolean;
}

export interface RelationshipGraphData {
  nodes: RelationshipNode[];
  links: RelationshipLink[];
}

export interface Threat {
  threat_id?: string;
  event_id?: string;
  user_id: string;
  user_name?: string;
  role?: string;
  account_type?: AccountType;
  risk_score: number;
  risk_level: RiskLevel;
  timestamp: string;
  primary_reasons: string[];
  recommended_action?: string;
  status?: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
}

export interface ResponseActionPayload {
  user_id: string;
  action: 'MONITOR' | 'VERIFY' | 'RESTRICT' | 'SUSPEND' | 'ESCALATE';
  reason: string;
  analyst_id: string;
  notes?: string;
}

export interface AnalystFeedback {
  incident_id: string;
  user_id: string;
  decision: 'CONFIRMED_THREAT' | 'FALSE_POSITIVE' | 'NEEDS_FURTHER_REVIEW';
  comment: string;
  timestamp: string;
  analyst: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  analyst: string;
  identity_id: string;
  action: string;
  reason: string;
  result: 'Completed' | 'Pending' | 'Failed';
  details?: string;
}

export interface AuditEventItem {
  event_id: string;
  timestamp: string;
  user_id: string;
  event_type: string;
  risk_score: number;
  severity: 'LOW' | 'MODERATE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  behaviour_score: number;
  sequence_score: number;
  context: {
    status: string;
    multiplier: number;
    info: Record<string, any> | null;
  };
  sequence: {
    chain_detected: boolean;
    matched_steps: Array<{ step: string; event_id: string; timestamp: string; matched: boolean }>;
  };
  signals: BehaviourSignal[];
  event: Record<string, any>;
}

export interface AuditLogResponse {
  items: AuditEventItem[];
  total: number;
}

export interface AuditQueryParams {
  severity?: string;
  user_id?: string;
  event_type?: string;
  start?: string;
  end?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'timestamp' | 'risk_score' | 'severity' | 'event_id';
  order?: 'asc' | 'desc';
}

export interface DashboardMetrics {
  behavioural_trust_score: number;
  behavioural_trust_trend: number;
  active_threats: number;
  active_threats_trend: number;
  privileged_identities: number;
  privileged_identities_trend: number;
  events_analyzed: number;
  events_analyzed_trend: number;
  threat_severity_counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  trust_landscape: {
    timestamp: string;
    trust_score: number;
    anomaly_count: number;
  }[];
}

export interface ModelStats {
  model_name: string;
  version: string;
  events_scored: number;
  anomalies_detected: number;
  anomaly_rate: number;
  last_updated: string;
}

export interface AnalyticsData {
  events_analyzed: number;
  anomalies_detected: number;
  at_risk_identities: number;
  confirmed_incidents: number;
  false_positive_rate: number;
  risk_by_role: { role: string; avg_risk: number; count: number }[];
  risk_by_account_type: { account_type: string; avg_risk: number; count: number }[];
  anomalies_trend: { date: string; anomalies: number; events: number }[];
  model_stats: ModelStats;
}
