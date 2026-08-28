import React from 'react';
import { Card } from '../common/Card';
import { BehaviourSequence } from '../../types/security';
import { Badge } from '../common/Badge';
import { GitCommit, ArrowDown, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface BehaviourSequenceTimelineProps {
  sequence: BehaviourSequence;
}

export const BehaviourSequenceTimeline: React.FC<BehaviourSequenceTimelineProps> = ({ sequence }) => {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[var(--snt-navy-500)] mb-4 gap-2">
        <div>
          <h3 className="snt-heading text-sm text-[var(--snt-text-primary)] uppercase tracking-wider flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-[var(--snt-accent)]" />
            Sequence Intelligence Timeline (USP 3)
          </h3>
          <p className="text-[10px] text-[var(--snt-text-tertiary)] uppercase tracking-wider mt-0.5">Chronological multi-stage attack chain correlation</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-[var(--snt-critical-bg)] border border-[var(--snt-critical-border)] rounded-sm text-right">
            <div className="text-[8px] font-bold text-[var(--snt-critical-text)] opacity-80 uppercase tracking-widest">SEQUENCE RISK</div>
            <div className="text-lg font-bold font-mono text-[var(--snt-critical-text)]">
              {sequence.sequence_risk} <span className="text-xs">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Notice */}
      <div className="p-3 bg-[var(--snt-critical-bg)] border-l-2 border-[var(--snt-critical-text)] rounded-r-sm mb-6 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-[var(--snt-critical-text)] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[var(--snt-critical-text)] font-medium leading-relaxed font-['IBM_Plex_Sans',sans-serif]">
          {sequence.summary}
        </p>
      </div>

      {/* Visual Sequence Chain */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--snt-navy-500)]">
        {sequence.events.map((evt, idx) => {
          const isCritical = evt.risk_level === 'CRITICAL';
          const isHigh = evt.risk_level === 'HIGH';
          const isLast = idx === sequence.events.length - 1;

          return (
            <motion.div
              key={evt.event_id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="relative group"
            >
              {/* Timeline Connector Dot */}
              <div
                className={clsx(
                  'absolute -left-[27px] top-1.5 w-2 h-2 rounded-sm border flex items-center justify-center bg-[var(--snt-navy-900)]',
                  isCritical ? 'border-[var(--snt-critical-text)]' : 
                  isHigh ? 'border-[var(--snt-high-text)]' : 
                  'border-[var(--snt-safe-text)]'
                )}
              >
                {isCritical && <div className="w-1 h-1 bg-[var(--snt-critical-text)] rounded-sm" />}
              </div>

              {/* Event Box */}
              <div className="bg-[var(--snt-navy-750)] border border-[var(--snt-navy-500)] p-3 rounded-sm hover:border-[var(--snt-navy-400)] transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-[var(--snt-text-tertiary)] bg-[var(--snt-navy-800)] px-1.5 py-0.5 border border-[var(--snt-navy-500)] rounded-sm">{evt.timestamp}</span>
                    <span className="text-[11px] font-bold text-[var(--snt-text-primary)] uppercase tracking-wider font-['Space_Grotesk',sans-serif]">
                      {evt.event_type}
                    </span>
                  </div>
                  <Badge variant="risk" riskLevel={evt.risk_level}>
                    {evt.risk_level}
                  </Badge>
                </div>

                <p className="text-[11px] text-[var(--snt-text-secondary)]">{evt.description}</p>

                {evt.details && (
                  <div className="mt-2 p-2 bg-[var(--snt-navy-900)] border border-[var(--snt-navy-500)] rounded-sm text-[10px] font-mono text-[var(--snt-text-secondary)] overflow-x-auto">
                    {JSON.stringify(evt.details)}
                  </div>
                )}
              </div>

              {!isLast && (
                <div className="flex justify-center my-1">
                  <ArrowDown className="w-3 h-3 text-[var(--snt-navy-400)]" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};
