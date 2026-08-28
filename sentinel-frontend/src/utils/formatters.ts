import { RiskLevel, AccountType } from '../types/security';

/**
 * Maps machine-readable event types to clean, SOC-grade human-readable display labels.
 * Preserves the underlying API value while providing consistent presentation.
 */
export function formatEventType(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') {
    return 'Unknown Event';
  }

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');

  const EVENT_TYPE_MAP: Record<string, string> = {
    UNUSUAL_LOGIN: 'Unusual Login',
    LOGIN: 'Login',
    PRIVILEGE_ESCALATION: 'Privilege Escalation',
    PRIVILEGE_CHANGE: 'Privilege Change',
    PRIVILEGE_MODIFIED: 'Privilege Modified',
    SENSITIVE_ACCESS: 'Sensitive Access',
    SENSITIVE_DATA_ACCESS: 'Sensitive Data Access',
    DATA_EXPORT: 'Data Export',
    SENSITIVE_DATA_EXPORT: 'Sensitive Data Export',
    BULK_DOWNLOAD: 'Bulk Download',
    OFF_HOURS_ACCESS: 'Off-Hours Access',
    NEW_DEVICE: 'New Device',
    BENEFICIARY_CHANGE: 'Beneficiary Change',
    NEW_BENEFICIARY: 'New Beneficiary',
    BENEFICIARY_CREATED: 'Beneficiary Created',
    LARGE_TRANSACTION: 'Large Transaction',
    LARGE_TRANSACTION_DETECTED: 'Large Transaction',
    TRANSACTION: 'Transaction',
    FILE_ACCESS: 'File Access',

    AUDIT_LOG_DISABLED: 'Audit Log Disabled',
    API_BURST_DEVIATION: 'API Burst Deviation',
    CONCURRENT_LOGIN: 'Concurrent Login',
    FOREX_RATE_OVERRIDE: 'Forex Rate Override',
    CLOUD_SECURITY_POLICY_MODIFIED: 'Cloud Security Policy Modified',
    EVENT: 'Security Event',
  };

  if (EVENT_TYPE_MAP[normalized]) {
    return EVENT_TYPE_MAP[normalized];
  }

  // If already mixed-case with spaces and no underscores, return as-is
  if (!value.includes('_') && /[A-Z]/.test(value) && /[a-z]/.test(value)) {
    return value.trim();
  }

  // Generic fallback: convert SNAKE_CASE to Title Case
  const words = normalized
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  return words.length > 0 ? words.join(' ') : 'Unknown Event';
}

/**
 * Maps raw context status values to clean, professional SOC labels.
 */
export function formatContextStatus(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') {
    return 'No Context Found';
  }

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');

  const CONTEXT_STATUS_MAP: Record<string, string> = {
    no_context_found: 'No Context Found',
    no_context: 'No Context Found',
    none: 'No Context Found',
    found: 'Context Found',
    context_found: 'Context Found',
    approved: 'Approved Context',
    matched: 'Approved Context',
    approved_context: 'Approved Context',
    denied: 'Denied Context',
    denied_context: 'Denied Context',
    ambiguous: 'Ambiguous Context',
    ambiguous_context: 'Ambiguous Context',
  };

  if (CONTEXT_STATUS_MAP[normalized]) {
    return CONTEXT_STATUS_MAP[normalized];
  }

  // If already mixed-case and human-readable, return as-is
  if (!value.includes('_') && /[A-Z]/.test(value) && /[a-z]/.test(value)) {
    return value.trim();
  }

  return 'Unknown Context';
}

/**
 * Maps raw severity strings to uniform title-cased severity labels.
 */
export function formatSeverity(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') {
    return 'Low';
  }

  const upper = value.trim().toUpperCase();
  switch (upper) {
    case 'CRITICAL':
      return 'Critical';
    case 'HIGH':
      return 'High';
    case 'MODERATE':
    case 'MEDIUM':
      return 'Moderate';
    case 'LOW':
      return 'Low';
    default:
      return upper.charAt(0) + upper.slice(1).toLowerCase();
  }
}

/**
 * Formats sequence step names (e.g. UNUSUAL_LOGIN -> Unusual Login).
 */
export function formatSequenceStep(value: string | undefined | null): string {
  return formatEventType(value);
}

/**
 * Maps identity status values to clean, professional SOC labels.
 */
export function formatIdentityStatus(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') {
    return 'Active';
  }

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');

  const IDENTITY_STATUS_MAP: Record<string, string> = {
    UNDER_INVESTIGATION: 'Under Investigation',
    ACTIVE: 'Active',
    MONITORED: 'Monitored',
    RESTRICTED: 'Restricted',
    SUSPENDED: 'Suspended',
    CRITICAL: 'Critical',
    HIGH: 'High',
    MODERATE: 'Moderate',
    MEDIUM: 'Medium',
    LOW: 'Low'
  };

  if (IDENTITY_STATUS_MAP[normalized]) {
    return IDENTITY_STATUS_MAP[normalized];
  }

  // Generic fallback: convert SNAKE_CASE to Title Case
  const words = normalized
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  return words.length > 0 ? words.join(' ') : 'Active';
}


/**
 * Maps behaviour signals and threat indicator names to clean, readable terminology.
 */
export function formatSignal(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') {
    return 'Unknown Signal';
  }

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');

  const SIGNAL_MAP: Record<string, string> = {
    LARGE_TRANSACTION: 'Large Transaction',
    LARGE_TRANSACTION_DETECTED: 'Large Transaction',
    TRANSACTION_AMOUNT_HIGH: 'High Transaction Amount',
    HIGH_TRANSACTION_AMOUNT: 'High Transaction Amount',
    HIGH_TRANSACTION_FREQUENCY: 'High Transaction Frequency',
    UNUSUAL_LOGIN: 'Unusual Login',
    AFTER_HOURS: 'Off-Hours Access',
    OFF_HOURS_ACCESS: 'Off-Hours Access',
    NEW_DEVICE: 'New Device',
    SENSITIVE_ACCESS: 'Sensitive Access',
    SENSITIVE_DATA_ACCESS: 'Sensitive Data Access',
    LARGE_DATA_ACCESS: 'Large Data Access',
    PRIVILEGE_CHANGE: 'Privilege Change',
    PRIVILEGE_ESCALATION: 'Privilege Escalation',
    PRIVILEGE_MODIFIED: 'Privilege Modified',
    NEW_BENEFICIARY: 'New Beneficiary',
    BENEFICIARY_CHANGE: 'Beneficiary Change',
    BENEFICIARY_CREATED: 'Beneficiary Created',
    DATA_EXPORT: 'Data Export',
    SENSITIVE_DATA_EXPORT: 'Sensitive Data Export',
    BULK_DOWNLOAD: 'Bulk Download',
    BEHAVIOURAL_ANOMALY: 'Behavioural Anomaly',
    CONCURRENT_LOGIN: 'Concurrent Login',
    FOREX_RATE_OVERRIDE: 'Forex Rate Override',
    CLOUD_SECURITY_POLICY_MODIFIED: 'Cloud Security Policy Modified',
    AUDIT_LOG_DISABLED: 'Audit Log Disabled',
    API_BURST_DEVIATION: 'API Burst Deviation',
    ISOLATION_FOREST_OUTLIER: 'Isolation Forest Outlier',
    DEVIANT_BASE_PATTERN: 'Deviant Base Pattern',
  };

  if (SIGNAL_MAP[normalized]) {
    return SIGNAL_MAP[normalized];
  }

  // If already mixed-case with spaces and no underscores, return as-is
  if (!value.includes('_') && /[A-Z]/.test(value) && /[a-z]/.test(value)) {
    return value.trim();
  }

  // Generic fallback: convert SNAKE_CASE to Title Case
  const words = normalized
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  return words.length > 0 ? words.join(' ') : 'Unknown Signal';
}


export function formatCurrency(amount: string | number): string {
  if (typeof amount === 'number') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }
  return amount;
}

export function getRiskColorClass(level: RiskLevel): {
  text: string;
  bg: string;
  border: string;
  badge: string;
  bar: string;
} {
  switch (level) {
    case 'CRITICAL':
      return {
        text: 'text-red-500',
        bg: 'bg-red-950/40',
        border: 'border-red-500/50',
        badge: 'bg-red-500/10 text-red-400 border-red-500/30',
        bar: 'bg-red-500'
      };
    case 'HIGH':
      return {
        text: 'text-orange-500',
        bg: 'bg-orange-950/40',
        border: 'border-orange-500/50',
        badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        bar: 'bg-orange-500'
      };
    case 'MEDIUM':
    case 'MODERATE':
      return {
        text: 'text-yellow-500',
        bg: 'bg-yellow-950/40',
        border: 'border-yellow-500/50',
        badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        bar: 'bg-yellow-500'
      };
    case 'LOW':
    default:
      return {
        text: 'text-emerald-500',
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-500/50',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        bar: 'bg-emerald-500'
      };
  }
}

export function getAccountTypeColor(accountType: AccountType): string {
  switch (accountType) {
    case 'Administrator':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    case 'Service Account':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    case 'Automated System':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'Employee':
    default:
      return 'bg-gray-500/10 text-gray-300 border-gray-500/30';
  }
}

/**
 * Formats a timestamp into a clean, human-readable format.
 * Fixes glued date-time strings (e.g. '2026-08-2809:42:31') and standardizes presentation.
 */
export function formatTimestamp(
  value: string | number | Date | undefined | null,
  formatType: 'full' | 'detailed' | 'compact' | 'dateOnly' | 'timeOnly' = 'full'
): string {
  if (!value) return '';

  let raw = String(value).trim();

  // If already just time (e.g. '02:11:04')
  if (/^\d{2}:\d{2}(?::\d{2})?$/.test(raw)) {
    return raw;
  }

  // Fix glued date-time like '2026-08-2809:42:31' -> '2026-08-28T09:42:31'
  const gluedMatch = raw.match(/^(\d{4}-\d{2}-\d{2})(\d{2}:\d{2}(?::\d{2})?.*)$/);
  if (gluedMatch) {
    raw = `${gluedMatch[1]}T${gluedMatch[2]}`;
  } else if (raw.includes(' ') && !raw.includes('T')) {
    raw = raw.replace(' ', 'T');
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Manual regex parsing for YYYY-MM-DDTHH:MM:SS to prevent timezone shifting
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2];
    const day = parseInt(isoMatch[3], 10);
    const mName = monthNames[parseInt(month, 10) - 1] || month;
    const hours = isoMatch[4] || '00';
    const mins = isoMatch[5] || '00';
    const secs = isoMatch[6] || '00';

    if (formatType === 'detailed') {
      return `${mName} ${day}, ${year} • ${hours}:${mins}:${secs}`;
    }
    if (formatType === 'compact') {
      return `${mName} ${day}, ${hours}:${mins}`;
    }
    if (formatType === 'dateOnly') {
      return `${mName} ${day}, ${year}`;
    }
    if (formatType === 'timeOnly') {
      return `${hours}:${mins}:${secs}`;
    }
    return `${mName} ${day}, ${year} ${hours}:${mins}:${secs}`;
  }

  const dateObj = new Date(raw);
  if (isNaN(dateObj.getTime())) {
    return raw;
  }

  const mName = monthNames[dateObj.getMonth()];
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const mins = String(dateObj.getMinutes()).padStart(2, '0');
  const secs = String(dateObj.getSeconds()).padStart(2, '0');

  if (formatType === 'detailed') {
    return `${mName} ${day}, ${year} • ${hours}:${mins}:${secs}`;
  }
  if (formatType === 'compact') {
    return `${mName} ${day}, ${hours}:${mins}`;
  }
  if (formatType === 'dateOnly') {
    return `${mName} ${day}, ${year}`;
  }
  if (formatType === 'timeOnly') {
    return `${hours}:${mins}:${secs}`;
  }
  return `${mName} ${day}, ${year} ${hours}:${mins}:${secs}`;
}

/**
 * Cleanly formats optional string values, returning empty string or semantic fallback.
 */
export function formatOptionalValue(value: string | undefined | null, fallback = ''): string {
  if (!value || value === 'N/A' || value === 'NA' || value === 'null' || value === 'undefined' || value === '-') {
    return fallback;
  }
  return value.trim();
}
