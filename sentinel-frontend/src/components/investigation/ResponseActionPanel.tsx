import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useResponseActionMutation } from '../../hooks/useSecurityData';
import { ShieldAlert, CheckCircle2, AlertOctagon, Lock, Eye, Send } from 'lucide-react';

interface ResponseActionPanelProps {
  userId: string;
  recommendedAction: string;
  riskLevel: string;
}

export const ResponseActionPanel: React.FC<ResponseActionPanelProps> = ({
  userId,
  recommendedAction,
  riskLevel
}) => {
  const [activeModalAction, setActiveModalAction] = useState<
    'MONITOR' | 'VERIFY' | 'RESTRICT' | 'SUSPEND' | 'ESCALATE' | null
  >(null);
  const [notes, setNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const responseMutation = useResponseActionMutation();

  const handleConfirmAction = () => {
    if (!activeModalAction) return;

    responseMutation.mutate(
      {
        user_id: userId,
        action: activeModalAction,
        reason: `SOC Intervention: Action ${activeModalAction} executed due to ${riskLevel} risk assessment.`,
        analyst_id: 'SOC Lead Analyst',
        notes: notes || 'Enforced via SENTINEL Response Control Panel.'
      },
      {
        onSuccess: (data) => {
          setActiveModalAction(null);
          setNotes('');
          setToastMessage(data.message);
          setTimeout(() => setToastMessage(null), 5000);
        }
      }
    );
  };

  const actionButtons = [
    { type: 'MONITOR' as const, label: 'MONITOR', icon: Eye, variant: 'secondary' as const },
    { type: 'VERIFY' as const, label: 'VERIFY', icon: CheckCircle2, variant: 'outline' as const },
    { type: 'RESTRICT' as const, label: 'RESTRICT', icon: Lock, variant: 'warning' as const },
    { type: 'SUSPEND' as const, label: 'SUSPEND', icon: AlertOctagon, variant: 'danger' as const },
    { type: 'ESCALATE' as const, label: 'ESCALATE', icon: Send, variant: 'danger' as const }
  ];

  return (
    <div className="snt-panel flex flex-col md:flex-row items-center justify-between gap-6 p-5 relative overflow-hidden">
      {/* Left accent strip for risk severity */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${riskLevel === 'CRITICAL' ? 'bg-[var(--snt-critical-text)]' : 'bg-[var(--snt-high-text)]'}`} />

      <div className="pl-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className={`w-4 h-4 ${riskLevel === 'CRITICAL' ? 'text-[var(--snt-critical-text)]' : 'text-[var(--snt-high-text)]'}`} />
          <h3 className="snt-heading text-sm text-[var(--snt-text-primary)] uppercase tracking-wider">
            Graduated Response Engine (USP 7)
          </h3>
        </div>
        <p className="text-[10px] text-[var(--snt-text-tertiary)] font-['IBM_Plex_Sans',sans-serif] mt-0.5">
          Recommended response strategy based on multi-stage risk assessment:
        </p>
        <div className="mt-3 flex items-center gap-3 font-mono">
          <span className="text-[9px] text-[var(--snt-text-secondary)] font-bold uppercase tracking-widest border border-[var(--snt-navy-500)] bg-[var(--snt-navy-800)] px-1.5 py-0.5 rounded-sm">Risk Level: {riskLevel}</span>
          <span className={`text-[10px] font-bold ${riskLevel === 'CRITICAL' ? 'text-[var(--snt-critical-text)] bg-[var(--snt-critical-bg)] border-[var(--snt-critical-border)]' : 'text-[var(--snt-high-text)] bg-[var(--snt-high-bg)] border-[var(--snt-high-border)]'} px-2 py-0.5 rounded-sm border uppercase tracking-wider`}>
            RECOMMENDED: {recommendedAction}
          </span>
        </div>
      </div>

      {/* Action Button Suite */}
      <div className="flex flex-wrap items-center gap-2">
        {actionButtons.map((btn) => {
          const Icon = btn.icon;
          const isRecommended = recommendedAction.includes(btn.type);

          return (
            <Button
              key={btn.type}
              variant={btn.variant}
              size="sm"
              icon={<Icon className="w-3.5 h-3.5" />}
              onClick={() => setActiveModalAction(btn.type)}
              className={isRecommended ? 'relative overflow-hidden before:absolute before:inset-0 before:border-2 before:border-white/20' : ''}
            >
              {btn.label}
            </Button>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!activeModalAction}
        onClose={() => setActiveModalAction(null)}
        title={`Confirm Action: ${activeModalAction} (${userId})`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-[var(--snt-critical-bg)] border border-[var(--snt-critical-border)] rounded-sm text-xs text-[var(--snt-critical-text)] font-['IBM_Plex_Sans',sans-serif]">
            <strong>Warning:</strong> Enforcing <strong>{activeModalAction}</strong> on identity{' '}
            <strong>{userId}</strong> will immediately propagate to enterprise IAM and SIEM.
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[var(--snt-text-tertiary)] uppercase tracking-wider mb-1.5">
              Analyst Intervention Justification / Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide context for audit log..."
              className="snt-input resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--snt-navy-500)]">
            <Button variant="secondary" size="md" onClick={() => setActiveModalAction(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={responseMutation.isPending}
              onClick={handleConfirmAction}
            >
              {responseMutation.isPending ? 'Enforcing...' : `Confirm ${activeModalAction}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Action Toast Notification */}
      {toastMessage && (
        <div className="absolute inset-0 bg-[var(--snt-navy-750)]/90 backdrop-blur-sm z-10 flex items-center justify-between px-6 border border-[var(--snt-safe-border)] shadow-lg animate-fade-in-up">
          <div className="flex items-center gap-3 font-semibold text-[var(--snt-safe-text)]">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-['IBM_Plex_Sans',sans-serif] text-sm">{toastMessage}</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--snt-safe-text)] tracking-widest border border-[var(--snt-safe-border)] px-2 py-1 rounded-sm bg-[var(--snt-safe-bg)]">AUDIT RECORDED</span>
        </div>
      )}
    </div>
  );
};
