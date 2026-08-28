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
    <Card className="border-cyan-500/40 bg-gradient-to-r from-[#111827] via-[#161f30] to-[#111827]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-black text-gray-100 uppercase tracking-wider">
              Graduated Response Engine (USP 7)
            </h3>
          </div>
          <p className="text-xs text-gray-300">
            Recommended response strategy based on multi-stage risk assessment:
          </p>
          <div className="mt-2 flex items-center gap-3 font-mono">
            <span className="text-xs text-gray-400 font-bold uppercase">Risk Level: {riskLevel}</span>
            <span className="text-sm font-black text-red-400 bg-red-950/80 px-2.5 py-0.5 rounded border border-red-800">
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
                className={isRecommended ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-[#0b0f17] scale-105' : ''}
              >
                {btn.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!activeModalAction}
        onClose={() => setActiveModalAction(null)}
        title={`Confirm Action: ${activeModalAction} (${userId})`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-xs text-red-300">
            <strong>Warning:</strong> Enforcing <strong>{activeModalAction}</strong> on identity{' '}
            <strong>{userId}</strong> will immediately propagate to enterprise IAM and SIEM.
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Analyst Intervention Justification / Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide context for audit log (e.g. Unauthorized beneficiary change detected after-hours)..."
              className="w-full p-2.5 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f293d]">
            <Button variant="secondary" size="sm" onClick={() => setActiveModalAction(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
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
        <div className="mt-4 p-3 bg-emerald-950 border border-emerald-500 text-emerald-300 rounded-lg text-xs flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-500">AUDIT RECORDED</span>
        </div>
      )}
    </Card>
  );
};
