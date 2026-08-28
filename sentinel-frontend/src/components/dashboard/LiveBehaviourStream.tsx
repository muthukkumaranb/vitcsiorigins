import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useNavigate } from 'react-router-dom';
import { SecurityEvent } from '../../types/security';
import { Clock, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


import { formatEventType, formatSeverity, formatTimestamp } from '../../utils/formatters';

interface LiveBehaviourStreamProps {
  events: SecurityEvent[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const LiveBehaviourStream: React.FC<LiveBehaviourStreamProps> = ({
  events,
  isLoading = false,
  isError = false,
  onRetry
}) => {
  const navigate = useNavigate();

  return (
    <Card className="col-span-full lg:col-span-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isError ? 'bg-amber-400' : 'bg-cyan-400 animate-pulse-live'}`} />
            Runtime Behaviour Stream
          </h2>
          <p className="text-xs text-gray-400">Observed runtime security telemetry stream</p>
        </div>
        <div className="flex items-center gap-2">
          {isError && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded transition"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          )}
          <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
            RUNTIME FEED
          </span>
        </div>
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {isLoading && (!events || events.length === 0) ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-[#0b0f17] rounded-lg border border-[#1f293d] space-y-2">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Connecting to live telemetry feed...</p>
          </div>
        ) : events && events.length > 0 ? (
          <AnimatePresence initial={false}>
            {events.slice(0, 10).map((evt) => (
              <motion.div
                key={evt.event_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate(`/investigation/${evt.event_id}`)}
                className="p-3 bg-[#0b0f17]/70 border border-[#1f293d] rounded-lg hover:border-cyan-500/40 hover:bg-[#161f30] transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400 shrink-0 mt-0.5">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span>{formatTimestamp(evt.timestamp, 'compact')}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                        {evt.event_id}
                      </span>
                      <span className="text-xs font-bold text-gray-200 group-hover:text-cyan-300 transition-colors">
                        {evt.user_id}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-300 truncate">
                        {formatEventType(evt.event_type)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{evt.description}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1">
                  <Badge variant="risk" riskLevel={evt.risk_level}>
                    {formatSeverity(evt.risk_level)}
                  </Badge>
                  {evt.amount && evt.amount !== '-' && (
                    <span className="text-[11px] font-mono font-bold text-cyan-400">
                      {evt.amount}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-12 text-center text-xs text-gray-400 bg-[#0b0f17] rounded-lg border border-[#1f293d] space-y-1">
            <p className="font-semibold text-slate-300">◐ Waiting for live telemetry events...</p>
            <p className="text-gray-500">The stream will populate automatically as events are generated or ingested.</p>
          </div>
        )}
      </div>
    </Card>
  );
};
