import {
  Identity,
  RiskAssessment,
  SecurityEvent,
  BehaviourSequence,
  BaselineMetric,
  PeerComparisonMetric,
  ContextAssessment,
  RelationshipGraphData,
  Threat,
  AuditLogEntry,
  DashboardMetrics,
  AnalyticsData
} from '../types/security';

export const MOCK_IDENTITIES: Identity[] = [
  {
    user_id: 'U0345',
    name: 'Vikram Sharma',
    account_type: 'Employee',
    role: 'Finance Operations',
    department: 'Finance & Treasury',
    privilege_level: 'HIGH',
    peer_group: 'Finance Operations',
    trust_score: 31,
    risk_score: 91,
    status: 'CRITICAL',
    last_activity: '02:22:15',
    normal_hours: '09:00 - 18:00 IST',
    normal_location: 'Mumbai HQ (Subnet 10.42.0.0/16)',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    user_id: 'U0123',
    name: 'Priya Sundaram',
    account_type: 'Administrator',
    role: 'Core Banking Administrator',
    department: 'IT Operations',
    privilege_level: 'SYSTEM_ADMIN',
    peer_group: 'Core Banking Admin Group',
    trust_score: 42,
    risk_score: 79,
    status: 'UNDER_INVESTIGATION',
    last_activity: '02:18:40',
    normal_hours: '08:30 - 17:30 IST',
    normal_location: 'Bengaluru Tech Center',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    user_id: 'U0892',
    name: 'Anish Verma',
    account_type: 'Employee',
    role: 'DevOps & Cloud Infra',
    department: 'Engineering',
    privilege_level: 'HIGH',
    peer_group: 'Cloud Infra Team',
    trust_score: 55,
    risk_score: 68,
    status: 'RESTRICTED',
    last_activity: '01:45:10',
    normal_hours: '10:00 - 19:00 IST',
    normal_location: 'Remote VPN (Subnet 172.16.0.0/12)',
  },
  {
    user_id: 'SA-9901',
    name: 'SWIFT-Auto-Gateway',
    account_type: 'Service Account',
    role: 'Automated Financial Settlement',
    department: 'Treasury Systems',
    privilege_level: 'HIGH',
    peer_group: 'Service Accounts',
    trust_score: 62,
    risk_score: 64,
    status: 'MONITORED',
    last_activity: '02:20:00',
    normal_hours: '24x7 Automated',
    normal_location: 'AWS us-east-1 VPC',
  },
  {
    user_id: 'U0412',
    name: 'Rahul Deshmukh',
    account_type: 'Employee',
    role: 'Payroll Administrator',
    department: 'Human Resources',
    privilege_level: 'MEDIUM',
    peer_group: 'HR Admin Group',
    trust_score: 88,
    risk_score: 18,
    status: 'ACTIVE',
    last_activity: '17:42:01',
    normal_hours: '09:30 - 18:30 IST',
    normal_location: 'Mumbai HQ',
  },
  {
    user_id: 'U0773',
    name: 'Kavita Menon',
    account_type: 'Administrator',
    role: 'Database Operations Lead',
    department: 'Data Management',
    privilege_level: 'SYSTEM_ADMIN',
    peer_group: 'DBA Team',
    trust_score: 91,
    risk_score: 12,
    status: 'ACTIVE',
    last_activity: '18:15:30',
    normal_hours: '09:00 - 18:00 IST',
    normal_location: 'Chennai Hub',
  },
  {
    user_id: 'SYS-BOT-44',
    name: 'Batch-Reconcile-Bot',
    account_type: 'Automated System',
    role: 'Nightly Transaction Auditor',
    department: 'Compliance Audit',
    privilege_level: 'MEDIUM',
    peer_group: 'Automated Batch Systems',
    trust_score: 95,
    risk_score: 8,
    status: 'ACTIVE',
    last_activity: '02:00:00',
    normal_hours: '01:00 - 04:00 IST',
    normal_location: 'Internal Server Subnet',
  },
  {
    user_id: 'U0219',
    name: 'Siddharth Rao',
    account_type: 'Employee',
    role: 'Risk Analyst',
    department: 'Risk Management',
    privilege_level: 'MEDIUM',
    peer_group: 'Risk Analysts',
    trust_score: 84,
    risk_score: 22,
    status: 'ACTIVE',
    last_activity: '16:50:11',
    normal_hours: '09:00 - 17:30 IST',
    normal_location: 'Hyderabad office',
  },
  {
    user_id: 'U0561',
    name: 'Rohan Mehta',
    account_type: 'Employee',
    role: 'Senior Treasury Manager',
    department: 'Finance & Treasury',
    privilege_level: 'HIGH',
    peer_group: 'Finance Operations',
    trust_score: 48,
    risk_score: 73,
    status: 'MONITORED',
    last_activity: '02:10:44',
    normal_hours: '09:00 - 18:00 IST',
    normal_location: 'Mumbai HQ',
  },
  {
    user_id: 'U0904',
    name: 'Neha Kapoor',
    account_type: 'Administrator',
    role: 'IAM & Directory Officer',
    department: 'Cybersecurity',
    privilege_level: 'SYSTEM_ADMIN',
    peer_group: 'IAM Administrators',
    trust_score: 94,
    risk_score: 9,
    status: 'ACTIVE',
    last_activity: '17:01:22',
    normal_hours: '09:00 - 18:00 IST',
    normal_location: 'Bengaluru Tech Center',
  },
  {
    user_id: 'SA-8812',
    name: 'Kafka-Event-Bridge',
    account_type: 'Service Account',
    role: 'Event Ingestion Stream',
    department: 'Data Platform',
    privilege_level: 'MEDIUM',
    peer_group: 'Service Accounts',
    trust_score: 98,
    risk_score: 4,
    status: 'ACTIVE',
    last_activity: '02:22:10',
    normal_hours: '24x7 Automated',
    normal_location: 'GCP asia-south1',
  },
  {
    user_id: 'U0632',
    name: 'Aakash Singhania',
    account_type: 'Employee',
    role: 'Loans Settlement Officer',
    department: 'Retail Banking Operations',
    privilege_level: 'MEDIUM',
    peer_group: 'Retail Ops',
    trust_score: 72,
    risk_score: 35,
    status: 'ACTIVE',
    last_activity: '15:22:04',
    normal_hours: '09:30 - 18:00 IST',
    normal_location: 'Delhi Regional Office',
  },
  {
    user_id: 'U1042',
    name: 'Tanya Banerjee',
    account_type: 'Employee',
    role: 'API Integration Lead',
    department: 'Engineering',
    privilege_level: 'HIGH',
    peer_group: 'Cloud Infra Team',
    trust_score: 86,
    risk_score: 21,
    status: 'ACTIVE',
    last_activity: '19:10:00',
    normal_hours: '10:00 - 19:00 IST',
    normal_location: 'Kolkata Tech Hub',
  },
  {
    user_id: 'U0118',
    name: 'Manish Pandey',
    account_type: 'Administrator',
    role: 'Network & Firewall Admin',
    department: 'Infrastructure Security',
    privilege_level: 'SYSTEM_ADMIN',
    peer_group: 'Network Admins',
    trust_score: 69,
    risk_score: 52,
    status: 'MONITORED',
    last_activity: '01:15:33',
    normal_hours: '08:00 - 17:00 IST',
    normal_location: 'Mumbai HQ',
  },
  {
    user_id: 'SA-3341',
    name: 'Jenkins-CI-Worker',
    account_type: 'Service Account',
    role: 'Build & Deploy Pipeline',
    department: 'DevOps',
    privilege_level: 'HIGH',
    peer_group: 'Service Accounts',
    trust_score: 92,
    risk_score: 14,
    status: 'ACTIVE',
    last_activity: '02:05:12',
    normal_hours: '24x7 Automated',
    normal_location: 'AWS us-east-1',
  },
  {
    user_id: 'U0588',
    name: 'Divya Nair',
    account_type: 'Employee',
    role: 'KYC Verification Lead',
    department: 'Compliance',
    privilege_level: 'MEDIUM',
    peer_group: 'Compliance Group',
    trust_score: 96,
    risk_score: 6,
    status: 'ACTIVE',
    last_activity: '16:11:09',
    normal_hours: '09:00 - 17:30 IST',
    normal_location: 'Kochi Branch',
  },
  {
    user_id: 'U0991',
    name: 'Farhan Qureshi',
    account_type: 'Employee',
    role: 'Foreign Exchange Specialist',
    department: 'Global Treasury',
    privilege_level: 'HIGH',
    peer_group: 'Finance Operations',
    trust_score: 51,
    risk_score: 69,
    status: 'UNDER_INVESTIGATION',
    last_activity: '02:04:19',
    normal_hours: '13:00 - 22:00 IST',
    normal_location: 'Mumbai Forex Desk',
  },
  {
    user_id: 'SYS-BOT-90',
    name: 'Sanctions-Check-Engine',
    account_type: 'Automated System',
    role: 'Realtime OFAC/AML Screener',
    department: 'Compliance Automation',
    privilege_level: 'MEDIUM',
    peer_group: 'Automated Batch Systems',
    trust_score: 99,
    risk_score: 2,
    status: 'ACTIVE',
    last_activity: '02:22:14',
    normal_hours: '24x7 Automated',
    normal_location: 'Internal Security VPC',
  },
  {
    user_id: 'U0334',
    name: 'Simran Kaur',
    account_type: 'Administrator',
    role: 'Key Management Admin',
    department: 'Crypto Security',
    privilege_level: 'SYSTEM_ADMIN',
    peer_group: 'Security Admins',
    trust_score: 87,
    risk_score: 19,
    status: 'ACTIVE',
    last_activity: '18:40:02',
    normal_hours: '09:00 - 18:00 IST',
    normal_location: 'Chandigarh Hub',
  },
  {
    user_id: 'U0711',
    name: 'Tarun Joshi',
    account_type: 'Employee',
    role: 'Wealth Management Advisor',
    department: 'Private Banking',
    privilege_level: 'MEDIUM',
    peer_group: 'Wealth Advisory',
    trust_score: 79,
    risk_score: 28,
    status: 'ACTIVE',
    last_activity: '17:33:45',
    normal_hours: '09:30 - 18:30 IST',
    normal_location: 'Pune Branch',
  }
];

// Details for Hero Profile U0345
export const HERO_RISK_ASSESSMENT: RiskAssessment = {
  user_id: 'U0345',
  risk_score: 91,
  risk_level: 'CRITICAL',
  trust_score: 31,
  anomaly_score: 94,
  behaviour_score: 89,
  sequence_score: 94,
  financial_score: 92,
  context_score: 86,
  recommended_action: 'SUSPEND + ESCALATE',
  risk_factors: [
    { name: 'Transaction Deviation', score: 24, description: 'Wire amount ₹8.4L is +342% above historical 30-day average (₹1.9L)', category: 'FINANCIAL' },
    { name: 'New Beneficiary', score: 19, description: 'Beneficiary Apex Offshore Corp added 6 minutes prior to transaction', category: 'ACCESS' },
    { name: 'After-hours Activity', score: 15, description: 'High-value action executed at 02:20 AM IST (Normal: 09:00–18:00)', category: 'TIMING' },
    { name: 'New Device', score: 12, description: 'Unregistered Mac OS X hardware footprint initialized at 02:11 AM', category: 'DEVICE' },
    { name: 'Privilege Change', score: 11, description: 'Self-escalated spending ceiling limit from ₹5L to ₹50L at 02:17 AM', category: 'PRIVILEGE' },
    { name: 'Sequence Deviation', score: 10, description: 'Rapid 6-step escalation chain executed in 11 minutes', category: 'SEQUENCE' }
  ]
};

export const HERO_BASELINE_METRICS: BaselineMetric[] = [
  { metric: 'Transactions / Day', normal_value: 12, current_value: 31, unit: 'tx', deviation_percentage: 158, is_anomalous: true },
  { metric: 'Average Transaction Amount', normal_value: '₹1.9L', current_value: '₹8.4L', unit: 'INR', deviation_percentage: 342, is_anomalous: true },
  { metric: 'Sensitive Data Records Exported', normal_value: 42, current_value: 387, unit: 'records', deviation_percentage: 821, is_anomalous: true },
  { metric: 'First Login Time', normal_value: '09:14 IST', current_value: '02:11 IST', unit: 'time', deviation_percentage: 100, is_anomalous: true },
  { metric: 'Active Registered Devices', normal_value: 2, current_value: 3, unit: 'devices', deviation_percentage: 50, is_anomalous: true },
  { metric: 'Resource Endpoints Accessed', normal_value: 14, current_value: 68, unit: 'endpoints', deviation_percentage: 385, is_anomalous: true }
];

export const HERO_PEER_COMPARISON: PeerComparisonMetric[] = [
  { metric: 'Transactions / Day', user_value: 31, peer_median: 14, unit: 'tx', variance: '+121% vs Peer Median', is_outlier: true },
  { metric: 'Avg Transaction Amount', user_value: '₹8.4L', peer_median: '₹2.1L', unit: 'INR', variance: '+300% vs Peer Median', is_outlier: true },
  { metric: 'Data Records Exported', user_value: 387, peer_median: 52, unit: 'records', variance: '+644% vs Peer Median', is_outlier: true },
  { metric: 'After-Hours Actions (7D)', user_value: 7, peer_median: 1, unit: 'actions', variance: '+600% vs Peer Median', is_outlier: true },
  { metric: 'Privilege Escalations', user_value: 3, peer_median: 0, unit: 'events', variance: 'Extreme Deviation', is_outlier: true }
];

export const HERO_SEQUENCE: BehaviourSequence = {
  sequence_id: 'SEQ-U0345-9982',
  user_id: 'U0345',
  sequence_risk: 94,
  start_time: '02:11:04',
  end_time: '02:22:15',
  summary: 'Individually authorized actions formed a suspicious high-risk behavioural sequence.',
  events: [
    {
      event_id: 'EVT-101',
      user_id: 'U0345',
      timestamp: '02:11:04',
      event_type: 'LOGIN',
      risk_level: 'LOW',
      description: 'Authentication via SSO from new unverified IP (182.72.112.4)',
      location: 'Mumbai (IP 182.72.112.4)',
      device: 'MacBook Pro Hardware Fingerprint #MB-889'
    },
    {
      event_id: 'EVT-102',
      user_id: 'U0345',
      timestamp: '02:12:30',
      event_type: 'NEW DEVICE',
      risk_level: 'MEDIUM',
      description: 'Added new browser session & registered device token without MFA challenge',
      device: 'MB-PRO-FIN-889'
    },
    {
      event_id: 'EVT-103',
      user_id: 'U0345',
      timestamp: '02:14:12',
      event_type: 'BENEFICIARY CREATED',
      risk_level: 'HIGH',
      description: 'Added foreign corporate account "Apex Offshore Corp" (AC: #994810238, IFSC: HDFC000998)',
      details: { beneficiary: 'Apex Offshore Corp', account_no: '994810238' }
    },
    {
      event_id: 'EVT-104',
      user_id: 'U0345',
      timestamp: '02:17:45',
      event_type: 'PRIVILEGE MODIFIED',
      risk_level: 'HIGH',
      description: 'Self-approved single transaction threshold override from ₹5,00,000 to ₹50,00,000',
      details: { old_limit: '₹5,00,000', new_limit: '₹50,00,000' }
    },
    {
      event_id: 'EVT-105',
      user_id: 'U0345',
      timestamp: '02:20:13',
      event_type: 'LARGE TRANSACTION',
      risk_level: 'CRITICAL',
      amount: '₹8,40,000',
      description: 'Executed instant wire transaction of ₹8,40,000 to newly created beneficiary "Apex Offshore Corp"',
      details: { recipient: 'Apex Offshore Corp', amount: '₹8,40,000' }
    },
    {
      event_id: 'EVT-106',
      user_id: 'U0345',
      timestamp: '02:22:15',
      event_type: 'SENSITIVE DATA ACCESS',
      risk_level: 'CRITICAL',
      description: 'Queried and exported 387 PII & financial vault records to local download folder',
      details: { query: 'SELECT * FROM customer_vault WHERE balance > 1000000', count: 387 }
    }
  ]
};

export const HERO_CONTEXT: ContextAssessment = {
  authorization: 'AUTHORIZED',
  behaviour: 'DEVIANT',
  peer_pattern: 'UNUSUAL',
  business_exception: false,
  maintenance_window: false,
  historical_risk: 'LOW',
  incident_ticket: false,
  context_risk: 'CRITICAL'
};

export const HERO_RELATIONSHIP_GRAPH: RelationshipGraphData = {
  nodes: [
    { id: 'U0345', label: 'Vikram Sharma (U0345)', type: 'USER', risk: 'CRITICAL', details: 'Finance Operations' },
    { id: 'BENEF-994', label: 'Apex Offshore Corp', type: 'BENEFICIARY', risk: 'CRITICAL', details: 'Added 02:14 AM' },
    { id: 'ACC-8812', label: 'Treasury Vault AC #992', type: 'ACCOUNT', risk: 'HIGH', details: 'Disbursed ₹8.4L' },
    { id: 'DEV-889', label: 'MacBook Pro #MB-889', type: 'DEVICE', risk: 'MEDIUM', details: 'New Unregistered Device' },
    { id: 'PRIV-FIN', label: 'SUPER_FIN_ADMIN', type: 'PRIVILEGE', risk: 'HIGH', details: 'Limit ₹50L Escalated' },
    { id: 'DB-VAULT', label: 'Customer Financial Vault DB', type: 'RESOURCE', risk: 'CRITICAL', details: '387 PII Records Exported' }
  ],
  links: [
    { source: 'U0345', target: 'BENEF-994', label: 'Created & Transferred ₹8.4L', isAnomalous: true },
    { source: 'U0345', target: 'ACC-8812', label: 'Authorized Transfer', isAnomalous: true },
    { source: 'U0345', target: 'DEV-889', label: 'LoggedIn (Unrecognized IP)', isAnomalous: true },
    { source: 'U0345', target: 'PRIV-FIN', label: 'Self-Escalated Limit', isAnomalous: true },
    { source: 'U0345', target: 'DB-VAULT', label: 'Extracted 387 Records', isAnomalous: true }
  ]
};

export const MOCK_THREATS: Threat[] = [
  {
    threat_id: 'THR-8891',
    user_id: 'U0345',
    user_name: 'Vikram Sharma',
    role: 'Finance Operations',
    account_type: 'Employee',
    risk_score: 91,
    risk_level: 'CRITICAL',
    timestamp: '02:20:13',
    primary_reasons: [
      'New Device Registration',
      'New Beneficiary Added',
      'Privilege Override',
      'Large Transaction (₹8.4L)',
      'After-hours Activity',
      'Sequence Anomaly'
    ],
    recommended_action: 'SUSPEND + ESCALATE',
    status: 'OPEN'
  },
  {
    threat_id: 'THR-8890',
    user_id: 'U0123',
    user_name: 'Priya Sundaram',
    role: 'Core Banking Administrator',
    account_type: 'Administrator',
    risk_score: 79,
    risk_level: 'HIGH',
    timestamp: '02:18:40',
    primary_reasons: [
      'Mass Table Alteration',
      'Disable Audit Logging Command',
      'Unusual Terminal Shell Access'
    ],
    recommended_action: 'RESTRICT + VERIFY',
    status: 'INVESTIGATING'
  },
  {
    threat_id: 'THR-8889',
    user_id: 'U0892',
    user_name: 'Anish Verma',
    role: 'DevOps & Cloud Infra',
    account_type: 'Employee',
    risk_score: 68,
    risk_level: 'HIGH',
    timestamp: '01:45:10',
    primary_reasons: [
      'AWS IAM Policy Wildcard Grant (*)',
      'S3 Bucket Public Access Toggle',
      'Off-hours SSH Connection'
    ],
    recommended_action: 'VERIFY + REVOKE',
    status: 'OPEN'
  },
  {
    threat_id: 'THR-8888',
    user_id: 'SA-9901',
    user_name: 'SWIFT-Auto-Gateway',
    role: 'Automated Financial Settlement',
    account_type: 'Service Account',
    risk_score: 64,
    risk_level: 'MEDIUM',
    timestamp: '02:20:00',
    primary_reasons: [
      'API Velocity Spike (+400%)',
      'Payload Signature Variance',
      'Unexpected Destination Subnet'
    ],
    recommended_action: 'MONITOR + RATE_LIMIT',
    status: 'OPEN'
  },
  {
    threat_id: 'THR-8887',
    user_id: 'U0561',
    user_name: 'Rohan Mehta',
    role: 'Senior Treasury Manager',
    account_type: 'Employee',
    risk_score: 73,
    risk_level: 'HIGH',
    timestamp: '02:10:44',
    primary_reasons: [
      'Concurrent Session from 2 Cities',
      'FX Trade Rate Overwrite',
      'High Volume Account Query'
    ],
    recommended_action: 'VERIFY + TERMINATE_SESSION',
    status: 'OPEN'
  },
  {
    threat_id: 'THR-8886',
    user_id: 'U0991',
    user_name: 'Farhan Qureshi',
    role: 'Foreign Exchange Specialist',
    account_type: 'Employee',
    risk_score: 69,
    risk_level: 'HIGH',
    timestamp: '02:04:19',
    primary_reasons: [
      'Off-hour Trade Execution',
      'Unusual Nostro Account Select',
      'Peer Group Outlier (+280%)'
    ],
    recommended_action: 'MONITOR',
    status: 'INVESTIGATING'
  },
  {
    threat_id: 'THR-8885',
    user_id: 'U0118',
    user_name: 'Manish Pandey',
    role: 'Network & Firewall Admin',
    account_type: 'Administrator',
    risk_score: 52,
    risk_level: 'MEDIUM',
    timestamp: '01:15:33',
    primary_reasons: [
      'Firewall Rule Deletion',
      'VPN Tunnel Bypass Attempt'
    ],
    recommended_action: 'VERIFY',
    status: 'OPEN'
  }
];

export const MOCK_EVENTS: SecurityEvent[] = [
  {
    event_id: 'EVT-901',
    user_id: 'U0345',
    user_name: 'Vikram Sharma',
    timestamp: '02:22:15',
    event_type: 'SENSITIVE DATA ACCESS',
    risk_level: 'CRITICAL',
    description: 'Queried and exported 387 PII customer vault records',
    amount: '-',
    location: 'Mumbai (IP 182.72.112.4)'
  },
  {
    event_id: 'EVT-902',
    user_id: 'U0345',
    user_name: 'Vikram Sharma',
    timestamp: '02:20:13',
    event_type: 'LARGE TRANSACTION',
    risk_level: 'CRITICAL',
    description: 'Wire transfer ₹8,40,000 to Apex Offshore Corp',
    amount: '₹8,40,000',
    location: 'Mumbai (IP 182.72.112.4)'
  },
  {
    event_id: 'EVT-903',
    user_id: 'U0123',
    user_name: 'Priya Sundaram',
    timestamp: '02:18:40',
    event_type: 'AUDIT LOG DISABLED',
    risk_level: 'HIGH',
    description: 'Executed SET GLOBAL general_log = OFF on CoreDB-01',
    amount: '-',
    location: 'Bengaluru'
  },
  {
    event_id: 'EVT-904',
    user_id: 'U0345',
    user_name: 'Vikram Sharma',
    timestamp: '02:17:45',
    event_type: 'PRIVILEGE MODIFIED',
    risk_level: 'HIGH',
    description: 'Self-approval threshold escalated to ₹50,00,000',
    amount: '₹50,00,000',
    location: 'Mumbai'
  },
  {
    event_id: 'EVT-905',
    user_id: 'SA-9901',
    user_name: 'SWIFT-Auto-Gateway',
    timestamp: '02:15:00',
    event_type: 'API BURST DEVIATION',
    risk_level: 'MEDIUM',
    description: 'Sent 1,420 settlement requests in 60s window',
    amount: '₹1.4 Cr',
    location: 'AWS us-east-1'
  },
  {
    event_id: 'EVT-906',
    user_id: 'U0345',
    user_name: 'Vikram Sharma',
    timestamp: '02:14:12',
    event_type: 'NEW BENEFICIARY',
    risk_level: 'HIGH',
    description: 'Created beneficiary Apex Offshore Corp (#994810238)',
    amount: '-',
    location: 'Mumbai'
  },
  {
    event_id: 'EVT-907',
    user_id: 'U0345',
    user_name: 'Vikram Sharma',
    timestamp: '02:12:30',
    event_type: 'NEW DEVICE',
    risk_level: 'MEDIUM',
    description: 'Hardware fingerprint registered: MB-PRO-FIN-889',
    amount: '-',
    location: 'Mumbai'
  },
  {
    event_id: 'EVT-908',
    user_id: 'U0561',
    user_name: 'Rohan Mehta',
    timestamp: '02:10:44',
    event_type: 'CONCURRENT LOGIN',
    risk_level: 'HIGH',
    description: 'Active logins detected from Mumbai and Frankfurt simultaneously',
    amount: '-',
    location: 'Frankfurt VPN'
  },
  {
    event_id: 'EVT-909',
    user_id: 'U0991',
    user_name: 'Farhan Qureshi',
    timestamp: '02:04:19',
    event_type: 'FOREX RATE OVERRIDE',
    risk_level: 'MEDIUM',
    description: 'Applied manual spot rate discount of 0.45% on USD/INR transaction',
    amount: '$120,000',
    location: 'Mumbai'
  },
  {
    event_id: 'EVT-910',
    user_id: 'U0892',
    user_name: 'Anish Verma',
    timestamp: '01:45:10',
    event_type: 'CLOUD SECURITY POLICY MODIFIED',
    risk_level: 'HIGH',
    description: 'Modified AWS S3 bucket policy prod-vault-backups to public read',
    amount: '-',
    location: 'Remote VPN'
  }
];

export const MOCK_DASHBOARD_METRICS: DashboardMetrics = {
  behavioural_trust_score: 78,
  behavioural_trust_trend: 8.4,
  active_threats: 12,
  active_threats_trend: -14.2,
  privileged_identities: 284,
  privileged_identities_trend: 3.1,
  events_analyzed: 48291,
  events_analyzed_trend: 12.8,
  threat_severity_counts: {
    critical: 3,
    high: 9,
    medium: 18,
    low: 43
  },
  trust_landscape: [
    { timestamp: '00:00', trust_score: 88, anomaly_count: 4 },
    { timestamp: '01:00', trust_score: 85, anomaly_count: 7 },
    { timestamp: '02:00', trust_score: 64, anomaly_count: 23 },
    { timestamp: '03:00', trust_score: 71, anomaly_count: 14 },
    { timestamp: '04:00', trust_score: 82, anomaly_count: 8 },
    { timestamp: '05:00', trust_score: 86, anomaly_count: 5 },
    { timestamp: '06:00', trust_score: 89, anomaly_count: 3 },
    { timestamp: '07:00', trust_score: 87, anomaly_count: 6 },
    { timestamp: '08:00', trust_score: 84, anomaly_count: 10 },
    { timestamp: '09:00', trust_score: 81, anomaly_count: 12 },
    { timestamp: '10:00', trust_score: 83, anomaly_count: 9 },
    { timestamp: '11:00', trust_score: 80, anomaly_count: 15 },
    { timestamp: '12:00', trust_score: 78, anomaly_count: 18 }
  ]
};

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-9912',
    timestamp: '2026-08-28 10:31:04',
    analyst: 'SOC Analyst Admin',
    identity_id: 'U0345',
    action: 'SUSPEND',
    reason: 'Critical risk 91 - Suspicious sequence & unauthorized ₹8.4L transaction',
    result: 'Completed',
    details: 'Account suspended and tickets generated in ServiceDesk (INC-8291)'
  },
  {
    id: 'AUD-9911',
    timestamp: '2026-08-28 10:18:22',
    analyst: 'SOC Lead Analyst',
    identity_id: 'U0123',
    action: 'VERIFY',
    reason: 'High anomaly - Core DB Audit logging command disabled',
    result: 'Completed',
    details: 'Triggered out-of-band push authentication to Priya Sundaram'
  },
  {
    id: 'AUD-9910',
    timestamp: '2026-08-28 09:45:11',
    analyst: 'Automated Response Engine',
    identity_id: 'SA-9901',
    action: 'RESTRICT',
    reason: 'API rate limit threshold breach (+400% velocity)',
    result: 'Completed',
    details: 'Throttled SWIFT gateway API key rate from 1000/min to 100/min'
  },
  {
    id: 'AUD-9909',
    timestamp: '2026-08-28 08:30:00',
    analyst: 'SOC Tier 2 Analyst',
    identity_id: 'U0892',
    action: 'ESCALATE',
    reason: 'S3 Public Access Toggle on prod-vault-backups bucket',
    result: 'Completed',
    details: 'Escalated to Cloud Infra Lead for immediate bucket ACL rollback'
  }
];

export const MOCK_ANALYTICS: AnalyticsData = {
  events_analyzed: 1842000,
  anomalies_detected: 4821,
  at_risk_identities: 27,
  confirmed_incidents: 14,
  false_positive_rate: 3.2,
  risk_by_role: [
    { role: 'Finance Operations', avg_risk: 76, count: 18 },
    { role: 'Core Banking Admin', avg_risk: 71, count: 12 },
    { role: 'Cloud Infra & DevOps', avg_risk: 58, count: 32 },
    { role: 'Database Operations', avg_risk: 42, count: 24 },
    { role: 'HR & Payroll', avg_risk: 18, count: 45 },
    { role: 'Compliance & Audit', avg_risk: 11, count: 28 }
  ],
  risk_by_account_type: [
    { account_type: 'Employee', avg_risk: 48, count: 180 },
    { account_type: 'Administrator', avg_risk: 68, count: 34 },
    { account_type: 'Service Account', avg_risk: 54, count: 42 },
    { account_type: 'Automated System', avg_risk: 14, count: 28 }
  ],
  anomalies_trend: [
    { date: 'Aug 22', anomalies: 320, events: 140000 },
    { date: 'Aug 23', anomalies: 280, events: 145000 },
    { date: 'Aug 24', anomalies: 410, events: 152000 },
    { date: 'Aug 25', anomalies: 390, events: 148000 },
    { date: 'Aug 26', anomalies: 520, events: 160000 },
    { date: 'Aug 27', anomalies: 610, events: 172000 },
    { date: 'Aug 28', anomalies: 1284, events: 184000 }
  ],
  model_stats: {
    model_name: 'Isolation Forest + Behavioural Sequence Transformer',
    version: 'v1.0.4-prod',
    events_scored: 48291,
    anomalies_detected: 1284,
    anomaly_rate: 2.65,
    last_updated: '12 minutes ago'
  }
};
