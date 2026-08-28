import React from 'react';
import { Card } from '../common/Card';
import { BehaviourSequence } from '../../types/security';
import { Badge } from '../common/Badge';
import { GitCommit, ArrowDown, AlertTriangle } from 'lucide-react';


import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { formatEventType, formatSeverity, formatTimestamp } from '../../utils/formatters';


interface BehaviourSequenceTimelineProps {
  sequence: BehaviourSequence;
}

export const BehaviourSequenceTimeline: React.FC<BehaviourSequenceTimelineProps> = ({ sequence }) => {
  return (
    <Card className="border-red-500/40 bg-gradient-to-b from-[#111827] via-[#161f30] to-[#111827]">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1f293d] mb-4 gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-red-400" />
            Sequence Intelligence Timeline (USP 3)
          </h3>
          <p className="text-xs text-gray-400">Chronological multi-stage attack chain correlation</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-red-950 border border-red-800 rounded-lg text-right">
            <div className="text-[9px] font-bold text-gray-400 uppercase">SEQUENCE RISK</div>
            <div className="text-lg font-black font-mono text-red-400">
              {sequence.sequence_risk} / 100
            </div>
          </div>
        </div>
      </div>

      {/* Hero Notice */}
      <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg mb-6 flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <p className="text-xs text-red-200 font-semibold leading-relaxed">
          {sequence.summary}
        </p>
      </div>

      {/* Visual Sequence Chain */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-cyan-500 before:via-orange-500 before:to-red-500">
        {sequence.events.map((evt, idx) => {
          const isCritical = evt.risk_level === 'CRITICAL';
          const isLast = idx === sequence.events.length - 1;

          return (
            <motion.div
              key={evt.event_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="relative group"
            >
              {/* Timeline Connector Dot */}
              <div
                className={clsx(
                  'absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 bg-[#0b0f17] flex items-center justify-center',
                  isCritical ? 'border-red-500 text-red-500 ring-4 ring-red-500/20' : 'border-cyan-500 text-cyan-400'
                )}
              >
                <div className={clsx('w-1.5 h-1.5 rounded-full', isCritical ? 'bg-red-500' : 'bg-cyan-400')} />
              </div>

              {/* Event Box */}
              <div className="bg-[#0b0f17] border border-[#1f293d] p-3.5 rounded-xl hover:border-cyan-500/50 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-400">
                      {formatTimestamp(evt.timestamp, 'compact')}
                    </span>
                    <span className="text-xs font-bold text-gray-100">
                      {formatEventType(evt.event_type)}
                    </span>
                  </div>

                  <Badge variant="risk" riskLevel={evt.risk_level}>
                    {formatSeverity(evt.risk_level)}
                  </Badge>
                </div>


                <p className="text-xs text-gray-300">{evt.description}</p>

                {evt.details && (
                  <div className="mt-2 p-2 bg-[#111827] border border-[#1f293d] rounded text-[11px] font-mono text-cyan-300">
                    {JSON.stringify(evt.details)}
                  </div>
                )}
              </div>

              {!isLast && (
                <div className="flex justify-center my-1 text-gray-600">
                  <ArrowDown className="w-3.5 h-3.5 text-cyan-500/60" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};
