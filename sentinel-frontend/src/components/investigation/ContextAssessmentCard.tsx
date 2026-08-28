import React from 'react';
import { Card } from '../common/Card';
import { ContextAssessment } from '../../types/security';
import { CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { clsx } from 'clsx';

interface ContextAssessmentCardProps {
  context: ContextAssessment;
}

export const ContextAssessmentCard: React.FC<ContextAssessmentCardProps> = ({ context }) => {
  const items = [
    { label: 'Authorization', status: context.authorization, isPositive: true, text: 'Authorized' },
    { label: 'Behaviour Baseline', status: context.behaviour, isPositive: false, text: 'Deviant' },
    { label: 'Peer Pattern', status: context.peer_pattern, isPositive: false, text: 'Unusual' },
    { label: 'Business Exception', status: context.business_exception ? 'Approved' : 'None', isPositive: context.business_exception, text: context.business_exception ? 'Approved' : 'None' },
    { label: 'Maintenance Window', status: context.maintenance_window ? 'Active' : 'None', isPositive: context.maintenance_window, text: context.maintenance_window ? 'Active' : 'None' },
    { label: 'Historical Risk Profile', status: context.historical_risk, isPositive: true, text: 'Low Risk History' },
    { label: 'Open Incident Ticket', status: context.incident_ticket ? 'Ticket Active' : 'None', isPositive: false, text: 'No Active Ticket' }
  ];

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--snt-navy-500)] mb-4">
        <h3 className="snt-heading text-sm text-[var(--snt-text-primary)] uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--snt-accent-light)]" />
          Contextual Assessment (USP 5)
        </h3>
        <span className="px-1.5 py-0.5 bg-[var(--snt-critical-bg)] text-[var(--snt-critical-text)] border border-[var(--snt-critical-border)] rounded-sm font-mono text-[9px] font-bold">
          CONTEXT RISK: {context.context_risk}
        </span>
      </div>

      <p className="text-[10px] text-[var(--snt-text-tertiary)] mb-4 italic font-['IBM_Plex_Sans',sans-serif]">
        "An anomaly does not automatically mean malicious activity. Context rules evaluate business exceptions and maintenance schedules."
      </p>

      <div className="space-y-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-1.5 px-2 bg-[var(--snt-navy-750)] border-b border-[var(--snt-navy-500)] last:border-b-0 hover:bg-[var(--snt-navy-700)] transition-colors">
            <span className="text-xs text-[var(--snt-text-primary)] font-medium font-['IBM_Plex_Sans',sans-serif]">{item.label}</span>
            <span
              className={clsx(
                'font-mono font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-wider',
                item.isPositive ? 'text-[var(--snt-safe-text)]' : 'text-[var(--snt-high-text)]'
              )}
            >
              {item.isPositive ? (
                <CheckCircle2 className="w-3 h-3 text-[var(--snt-safe-text)]" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-[var(--snt-high-text)]" />
              )}
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
