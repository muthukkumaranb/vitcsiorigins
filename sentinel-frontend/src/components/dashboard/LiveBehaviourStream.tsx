import React from 'react';
import { Badge } from '../common/Badge';
import { useNavigate } from 'react-router-dom';
import { SecurityEvent } from '../../types/security';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveBehaviourStreamProps {
  events: SecurityEvent[];
}

export const LiveBehaviourStream: React.FC<LiveBehaviourStreamProps> = ({ events }) => {
  const navigate = useNavigate();

  return (
    <div className="snt-panel col-span-full lg:col-span-5 p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--snt-navy-500)]">
        <div>
          <h2 className="snt-heading text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--snt-safe-text)] animate-pulse-live" />
            Live Behaviour Stream
          </h2>
          <p className="text-[10px] text-[var(--snt-text-tertiary)] uppercase tracking-wider font-['IBM_Plex_Sans',sans-serif] mt-0.5">Real-time privileged telemetry</p>
        </div>
        <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider font-mono bg-[var(--snt-navy-700)] text-[var(--snt-text-secondary)] border border-[var(--snt-navy-500)] rounded-sm">
          LIVE FEED
        </span>
      </div>

      <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {events.slice(0, 8).map((evt) => (
            <motion.div
              key={evt.event_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => navigate(`/investigation/${evt.user_id}`)}
              className="relative p-2.5 bg-[var(--snt-navy-750)] border border-[var(--snt-navy-500)] rounded-sm hover:border-[var(--snt-navy-400)] hover:bg-[var(--snt-navy-700)] transition-all cursor-pointer flex items-center justify-between gap-3 group overflow-hidden"
            >
              {/* Left accent strip based on risk */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-0.5 opacity-80 ${
                  evt.risk_level === 'CRITICAL' ? 'bg-[var(--snt-critical-text)]' :
                  evt.risk_level === 'HIGH' ? 'bg-[var(--snt-high-text)]' :
                  evt.risk_level === 'MEDIUM' ? 'bg-[var(--snt-medium-text)]' :
                  'bg-[var(--snt-safe-text)]'
                }`}
              />

              <div className="flex items-start gap-3 min-w-0 pl-1.5">
                <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--snt-text-tertiary)] shrink-0 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{evt.timestamp}</span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[var(--snt-text-primary)] font-mono group-hover:text-[var(--snt-text-secondary)] transition-colors">
                      {evt.user_id}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--snt-text-secondary)] truncate uppercase tracking-wider">
                      {evt.event_type}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--snt-text-tertiary)] truncate mt-0.5">{evt.description}</p>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 gap-1">
                <Badge variant="risk" riskLevel={evt.risk_level}>
                  {evt.risk_level}
                </Badge>
                {evt.amount && (
                  <span className="text-[10px] font-mono font-semibold text-[var(--snt-text-secondary)]">
                    {evt.amount}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
