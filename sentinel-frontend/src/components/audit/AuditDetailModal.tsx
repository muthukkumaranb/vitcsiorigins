import React from 'react';
import { AuditEventItem } from '../../types/security';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import {
  ShieldAlert,
  Clock,
  User,
  Activity,
  Layers,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';

interface AuditDetailModalProps {
  event: AuditEventItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
  event,
  isOpen,
  onClose
}) => {
  if (!event) return null;

  const getSeverityBadgeVariant = (severity: string) => {
    const s = severity.toUpperCase();
    if (s === 'CRITICAL' || s === 'HIGH' || s === 'LOW') return s as any;
    return 'MEDIUM';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Security Event Investigation — ${event.event_id}`}
      maxWidth="xl"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1 text-gray-200">
        {/* Top Header Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0b0f17] p-4 rounded-lg border border-[#1f293d]">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-500" /> Timestamp
            </div>
            <div className="text-xs font-mono font-medium text-gray-200">
              {event.timestamp || 'N/A'}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-cyan-400" /> User ID
            </div>
            <div className="text-xs font-mono font-bold text-cyan-400">
              {event.user_id || 'N/A'}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-gray-400" /> Event Type
            </div>
            <div className="text-xs font-mono font-semibold text-gray-300 uppercase">
              {event.event_type || 'N/A'}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
              Severity
            </div>
            <div>
              <Badge variant="risk" riskLevel={getSeverityBadgeVariant(event.severity)}>
                {event.severity}
              </Badge>
            </div>
          </div>
        </div>

        {/* Risk Score Assessment Grid */}
        <div className="bg-[#0e1420] p-4 rounded-lg border border-[#1f293d]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            Risk Assessment Breakdown
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-[#111827] rounded-lg border border-[#1f293d]">
              <div className="text-[10px] text-gray-400 uppercase">Overall Risk Score</div>
              <div
                className={clsx(
                  'text-2xl font-black font-mono mt-1',
                  event.risk_score >= 75
                    ? 'text-red-400'
                    : event.risk_score >= 50
                    ? 'text-orange-400'
                    : event.risk_score >= 25
                    ? 'text-yellow-400'
                    : 'text-emerald-400'
                )}
              >
                {event.risk_score}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Scale 0 - 100</div>
            </div>

            <div className="p-3 bg-[#111827] rounded-lg border border-[#1f293d]">
              <div className="text-[10px] text-gray-400 uppercase">Behaviour Score</div>
              <div className="text-2xl font-black font-mono mt-1 text-cyan-400">
                {event.behaviour_score}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Weight: 60%</div>
            </div>

            <div className="p-3 bg-[#111827] rounded-lg border border-[#1f293d]">
              <div className="text-[10px] text-gray-400 uppercase">Sequence Score</div>
              <div className="text-2xl font-black font-mono mt-1 text-purple-400">
                {event.sequence_score}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Weight: 40%</div>
            </div>

            <div className="p-3 bg-[#111827] rounded-lg border border-[#1f293d]">
              <div className="text-[10px] text-gray-400 uppercase">Context Multiplier</div>
              <div className="text-2xl font-black font-mono mt-1 text-gray-200">
                {event.context?.multiplier ? `${event.context.multiplier}x` : '1.0x'}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {event.context?.status === 'found' ? 'Context Applied' : 'No Suppression'}
              </div>
            </div>
          </div>
        </div>

        {/* Behaviour Signals */}
        <div className="bg-[#0e1420] p-4 rounded-lg border border-[#1f293d]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-orange-400" />
            Detected Behaviour Signals ({event.signals?.length || 0})
          </h4>
          {event.signals && event.signals.length > 0 ? (
            <div className="space-y-2">
              {event.signals.map((sig, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-2.5 bg-[#111827] border border-[#1f293d] rounded text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-mono font-bold text-orange-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {sig.signal}
                    </div>
                    <div className="text-gray-400 text-[11px]">{sig.description}</div>
                  </div>
                  <span className="font-mono font-bold text-red-400 text-xs shrink-0 ml-2">
                    +{sig.contribution} pts
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-[#111827] rounded border border-[#1f293d] text-xs text-gray-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              No behavioural anomaly signals triggered for this event.
            </div>
          )}
        </div>

        {/* Sequence Analysis */}
        <div className="bg-[#0e1420] p-4 rounded-lg border border-[#1f293d]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-purple-400" />
            Sequence Chain Analysis
          </h4>
          {event.sequence?.chain_detected ? (
            <div className="mb-3 p-2.5 bg-red-950/40 border border-red-800/50 rounded flex items-center gap-2 text-xs text-red-300 font-semibold">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Attack Chain Detected: Multi-step insider sequence matched within 60-minute window.
            </div>
          ) : (
            <div className="mb-3 p-2.5 bg-[#111827] border border-[#1f293d] rounded flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              No complete insider threat attack chain detected.
            </div>
          )}

          {event.sequence?.matched_steps && event.sequence.matched_steps.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                Matched Lookback Sequence Steps:
              </div>
              {event.sequence.matched_steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-[#111827] border border-[#1f293d] rounded text-[11px] font-mono"
                >
                  <span className="text-purple-300 font-bold">
                    Step {idx + 1}: {step.step}
                  </span>
                  <span className="text-gray-400">
                    Event {step.event_id} ({step.timestamp})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Context Information */}
        <div className="bg-[#0e1420] p-4 rounded-lg border border-[#1f293d]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-cyan-400" />
            Operational Context Status
          </h4>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Status:</span>
            <span
              className={clsx(
                'px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold border',
                event.context?.status === 'found'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : event.context?.status === 'ambiguous'
                  ? 'bg-yellow-950 text-yellow-400 border-yellow-800'
                  : 'bg-gray-800 text-gray-400 border-gray-700'
              )}
            >
              {event.context?.status || 'no_context_found'}
            </span>
          </div>
          {event.context?.info && (
            <div className="mt-2 p-2.5 bg-[#111827] rounded border border-[#1f293d] text-xs font-mono text-gray-300">
              <pre className="overflow-x-auto text-[11px]">
                {JSON.stringify(event.context.info, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Raw Event Attributes */}
        <div className="bg-[#0e1420] p-4 rounded-lg border border-[#1f293d]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-gray-400" />
            Event Payload Attributes
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
            {event.event &&
              Object.entries(event.event)
                .filter(([k]) => !k.startsWith('_'))
                .map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2 bg-[#111827] rounded border border-[#1f293d]/60"
                  >
                    <div className="text-[10px] text-gray-500 uppercase">{key}</div>
                    <div className="text-gray-300 truncate mt-0.5">
                      {val !== '' && val !== null && val !== undefined ? String(val) : 'N/A'}
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
