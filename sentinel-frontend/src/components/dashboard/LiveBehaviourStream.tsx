import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useNavigate } from 'react-router-dom';
import { SecurityEvent } from '../../types/security';
import { Activity, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';

interface LiveBehaviourStreamProps {
  events: SecurityEvent[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const LiveBehaviourStream: React.FC<LiveBehaviourStreamProps> = ({ events, isLoading, isError, onRetry }) => {
  const navigate = useNavigate();

  return (
    <Card className="col-span-full lg:col-span-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Live Behaviour Stream
          </h2>
          <p className="text-xs text-gray-400">Polling runtime event telemetry every 10 seconds</p>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
          POLLING FEED
        </span>
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {isLoading ? <div className="space-y-2"><div className="h-16 animate-pulse rounded-lg bg-gray-800/40" /><div className="h-16 animate-pulse rounded-lg bg-gray-800/40" /></div> : isError ? <ErrorState message="Unable to load runtime behaviour events." onRetry={onRetry} /> : events.length === 0 ? <EmptyState title="No Runtime Events" description="No events are currently available from the runtime source." /> : <AnimatePresence initial={false}>
          {events.slice(0, 8).map((evt) => (
            <motion.div
              key={evt.event_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => navigate(`/investigation/${evt.user_id}`)}
              className="p-3 bg-[#0b0f17]/70 border border-[#1f293d] rounded-lg hover:border-cyan-500/40 hover:bg-[#161f30] transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400 shrink-0 mt-0.5">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span>{evt.timestamp}</span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-200 group-hover:text-cyan-300 transition-colors">
                      {evt.user_id}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-300 truncate">
                      {evt.event_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{evt.description}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-gray-500">
                    {evt.risk_score !== undefined && <span>Risk {evt.risk_score}/100</span>}
                    {evt.sequence?.chain_detected && <span className="text-amber-400">Sequence detected</span>}
                    {evt.context?.status && evt.context.status !== 'none' && <span>Context: {evt.context.status}</span>}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 gap-1">
                <Badge variant="risk" riskLevel={evt.risk_level}>
                  {evt.risk_level}
                </Badge>
                {evt.amount && (
                  <span className="text-[11px] font-mono font-bold text-cyan-400">
                    {evt.amount}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>}
      </div>
    </Card>
  );
};
