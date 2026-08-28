import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { AuditEventItem } from '../../types/security';
import {
  Clock,
  User,
  ShieldAlert,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatEventType, formatContextStatus, formatSeverity, formatTimestamp } from '../../utils/formatters';


interface AuditTableProps {
  logs: AuditEventItem[];
  onSelectEvent: (event: AuditEventItem) => void;
  sortColumn?: 'timestamp' | 'risk_score' | 'severity' | 'event_id';
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: 'timestamp' | 'risk_score' | 'severity' | 'event_id') => void;
}

export const AuditTable: React.FC<AuditTableProps> = ({
  logs,
  onSelectEvent,
  sortColumn = 'timestamp',
  sortDirection = 'desc',
  onSort
}) => {
  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'CRITICAL';
      case 'HIGH':
        return 'HIGH';
      case 'MODERATE':
      case 'MEDIUM':
        return 'MEDIUM';
      case 'LOW':
      default:
        return 'LOW';
    }
  };

  const renderSortIcon = (column: 'timestamp' | 'risk_score' | 'severity' | 'event_id') => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 text-gray-500 opacity-60" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-cyan-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-cyan-400" />
    );
  };

  const formatTimestampDisplay = (ts: string) => {
    return formatTimestamp(ts, 'detailed');
  };

  return (
    <Card className="overflow-hidden p-0 border border-[#1f293d]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0b0f17] border-b border-[#1f293d] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <th
                className="py-3.5 px-4 cursor-pointer select-none hover:text-gray-200 transition-colors"
                onClick={() => onSort?.('timestamp')}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span>Time</span>
                  {renderSortIcon('timestamp')}
                </div>
              </th>

              <th
                className="py-3.5 px-3 cursor-pointer select-none hover:text-gray-200 transition-colors"
                onClick={() => onSort?.('event_id')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Event ID</span>
                  {renderSortIcon('event_id')}
                </div>
              </th>

              <th className="py-3.5 px-3">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>User</span>
                </div>
              </th>

              <th className="py-3.5 px-3">Event Type</th>

              <th
                className="py-3.5 px-3 cursor-pointer select-none hover:text-gray-200 transition-colors text-center"
                onClick={() => onSort?.('risk_score')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Risk</span>
                  {renderSortIcon('risk_score')}
                </div>
              </th>

              <th
                className="py-3.5 px-3 cursor-pointer select-none hover:text-gray-200 transition-colors"
                onClick={() => onSort?.('severity')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Severity</span>
                  {renderSortIcon('severity')}
                </div>
              </th>

              <th className="py-3.5 px-3">Context Status</th>

              <th className="py-3.5 px-3">Sequence Chain</th>

              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f293d]/60 font-mono bg-[#111827]">
            {logs.map((item) => (
              <tr
                key={item.event_id}
                onClick={() => onSelectEvent(item)}
                className="hover:bg-[#162032] transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4 text-[11px] whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-mono">
                    {formatTimestampDisplay(item.timestamp)}
                  </div>
                </td>

                <td className="py-3 px-3 font-bold text-gray-200 group-hover:text-cyan-400 transition-colors">
                  {item.event_id}
                </td>

                <td className="py-3 px-3 font-bold text-cyan-300">
                  {item.user_id}
                </td>

                <td className="py-3 px-3">
                  <span className="font-sans text-[11px] font-semibold text-gray-200 bg-gray-850 px-2 py-0.5 rounded border border-gray-700/60 whitespace-nowrap">
                    {formatEventType(item.event_type)}
                  </span>
                </td>

                <td className="py-3 px-3 text-center">
                  <span
                    className={clsx(
                      'font-black font-mono text-xs px-2 py-0.5 rounded',
                      item.risk_score >= 75
                        ? 'text-red-400 bg-red-950/60 border border-red-800/50'
                        : item.risk_score >= 50
                        ? 'text-orange-400 bg-orange-950/60 border border-orange-800/50'
                        : item.risk_score >= 25
                        ? 'text-yellow-400 bg-yellow-950/60 border border-yellow-800/50'
                        : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50'
                    )}
                  >
                    {item.risk_score}
                  </span>
                </td>

                <td className="py-3 px-3">
                  <Badge variant="risk" riskLevel={getSeverityBadgeVariant(item.severity)}>
                    {formatSeverity(item.severity)}
                  </Badge>
                </td>

                <td className="py-3 px-3 font-sans">
                  <span
                    className={clsx(
                      'text-[10px] font-sans px-2 py-0.5 rounded border font-semibold whitespace-nowrap',
                      item.context?.status === 'found' || item.context?.status === 'approved' || item.context?.status === 'matched'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : item.context?.status === 'ambiguous'
                        ? 'bg-yellow-950/80 text-yellow-300 border-yellow-800'
                        : 'bg-gray-900 text-gray-400 border-gray-800'
                    )}
                  >
                    {formatContextStatus(item.context?.status)}
                  </span>
                </td>


                <td className="py-3 px-3 font-sans">
                  {item.sequence?.chain_detected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-800 px-2 py-0.5 rounded">
                      <ShieldAlert className="w-3 h-3" />
                      CHAIN DETECTED
                    </span>
                  ) : item.sequence?.matched_steps && item.sequence.matched_steps.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-purple-300 bg-purple-950/50 border border-purple-800 px-1.5 py-0.5 rounded">
                      <Layers className="w-3 h-3" />
                      {item.sequence.matched_steps.length} STEP{item.sequence.matched_steps.length > 1 ? 'S' : ''}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-[11px] font-mono">None</span>
                  )}
                </td>

                <td className="py-3 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(item);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/80 px-2.5 py-1 rounded transition-colors"
                  >
                    <Search className="w-3 h-3" />
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
