import React from 'react';
import { Card } from '../common/Card';
import { ModelStats } from '../../types/security';
import { Cpu, CheckCircle2, Clock } from 'lucide-react';

interface ModelStatsCardProps {
  stats: ModelStats;
}

export const ModelStatsCard: React.FC<ModelStatsCardProps> = ({ stats }) => {
  return (
    <Card className="border-cyan-500/30 bg-gradient-to-r from-[#111827] via-[#161f30] to-[#111827]">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1f293d] mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-100 uppercase tracking-wider">
              ML Model Transparency & Engine Telemetry
            </h3>
            <p className="text-xs text-gray-400">
              Unsupervised anomaly detection & sequence transformer metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 border border-cyan-800 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>STATUS: ACTIVE & SCORING</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 font-mono">
        <div className="p-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg">
          <div className="text-[10px] text-gray-400 font-bold uppercase">ALGORITHM</div>
          <div className="text-xs font-extrabold text-gray-100 truncate mt-1">{stats.model_name}</div>
        </div>

        <div className="p-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg">
          <div className="text-[10px] text-gray-400 font-bold uppercase">VERSION</div>
          <div className="text-xs font-extrabold text-cyan-400 mt-1">{stats.version}</div>
        </div>

        <div className="p-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg">
          <div className="text-[10px] text-gray-400 font-bold uppercase">EVENTS SCORED</div>
          <div className="text-base font-black text-gray-100 mt-1">{stats.events_scored.toLocaleString()}</div>
        </div>

        <div className="p-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg">
          <div className="text-[10px] text-gray-400 font-bold uppercase">ANOMALIES DETECTED</div>
          <div className="text-base font-black text-red-400 mt-1">{stats.anomalies_detected.toLocaleString()}</div>
        </div>

        <div className="p-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg">
          <div className="text-[10px] text-gray-400 font-bold uppercase">ANOMALY RATE</div>
          <div className="text-base font-black text-amber-400 mt-1">{stats.anomaly_rate}%</div>
        </div>

        <div className="p-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg">
          <div className="text-[10px] text-gray-400 font-bold uppercase">LAST UPDATED</div>
          <div className="text-xs font-semibold text-gray-300 flex items-center gap-1 mt-1 font-sans">
            <Clock className="w-3 h-3 text-gray-500" />
            {stats.last_updated}
          </div>
        </div>
      </div>
    </Card>
  );
};
