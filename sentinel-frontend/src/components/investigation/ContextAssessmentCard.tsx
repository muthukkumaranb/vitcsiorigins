import React from 'react';
import { Card } from '../common/Card';
import { ContextAssessment } from '../../types/security';
import { CheckCircle2, AlertTriangle, XCircle, Shield } from 'lucide-react';
import { clsx } from 'clsx';

interface ContextAssessmentCardProps {
  context: ContextAssessment;
}

export const ContextAssessmentCard: React.FC<ContextAssessmentCardProps> = ({ context }) => {
  const items = [
    { label: 'Authorization', status: context.authorization, isPositive: true, text: '✓ Authorized' },
    { label: 'Behaviour Baseline', status: context.behaviour, isPositive: false, text: '⚠ Deviant' },
    { label: 'Peer Pattern', status: context.peer_pattern, isPositive: false, text: '⚠ Unusual' },
    { label: 'Business Exception', status: context.business_exception ? 'Approved' : 'None', isPositive: context.business_exception, text: context.business_exception ? '✓ Approved' : '✕ None' },
    { label: 'Maintenance Window', status: context.maintenance_window ? 'Active' : 'None', isPositive: context.maintenance_window, text: context.maintenance_window ? '✓ Active' : '✕ None' },
    { label: 'Historical Risk Profile', status: context.historical_risk, isPositive: true, text: '✓ Low Risk History' },
    { label: 'Open Incident Ticket', status: context.incident_ticket ? 'Ticket Active' : 'None', isPositive: false, text: '✕ No Active Ticket' }
  ];

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
        <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Contextual Assessment (USP 5)
        </h3>
        <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded font-mono text-[10px] font-bold">
          CONTEXT RISK: {context.context_risk}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-4 italic">
        "An anomaly does not automatically mean malicious activity. Context rules evaluate business exceptions and maintenance schedules."
      </p>

      <div className="space-y-2.5 text-xs">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-1.5 px-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg">
            <span className="text-gray-300 font-medium">{item.label}</span>
            <span
              className={clsx(
                'font-mono font-bold flex items-center gap-1 text-[11px]',
                item.isPositive ? 'text-emerald-400' : 'text-amber-400'
              )}
            >
              {item.isPositive ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
