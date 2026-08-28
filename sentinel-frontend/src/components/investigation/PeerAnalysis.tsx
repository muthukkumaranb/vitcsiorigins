import React from 'react';
import { Card } from '../common/Card';
import { PeerComparisonMetric } from '../../types/security';
import { Users, AlertCircle } from 'lucide-react';

interface PeerAnalysisProps {
  peerMetrics: PeerComparisonMetric[];
  peerGroup: string;
}

export const PeerAnalysis: React.FC<PeerAnalysisProps> = ({ peerMetrics, peerGroup }) => {
  return (
    <Card>
      <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Peer Group Analysis (USP 4: False Positive Reduction)
          </h3>
          <p className="text-xs text-gray-400">Comparing user actions against peer cohort ({peerGroup})</p>
        </div>
        <span className="px-2 py-0.5 text-[10px] bg-amber-950 text-amber-400 border border-amber-800 rounded font-mono font-bold">
          EXTREME OUTLIER
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1f293d] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="pb-2 px-3">Metric</th>
              <th className="pb-2 px-3 text-cyan-400 font-bold">User (U0345)</th>
              <th className="pb-2 px-3">Peer Group Median</th>
              <th className="pb-2 px-3 text-center">Cohort Variance</th>
              <th className="pb-2 px-3 text-right">Outlier Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f293d]/50 font-mono">
            {peerMetrics.map((p, idx) => (
              <tr key={idx} className={p.is_outlier ? 'bg-orange-950/20' : 'hover:bg-[#161f30]'}>
                <td className="py-2.5 px-3 font-sans font-semibold text-gray-200">{p.metric}</td>
                <td className="py-2.5 px-3 font-extrabold text-cyan-300">{p.user_value}</td>
                <td className="py-2.5 px-3 text-gray-400">{p.peer_median}</td>
                <td className="py-2.5 px-3 text-center font-bold text-orange-400">{p.variance}</td>
                <td className="py-2.5 px-3 text-right font-sans">
                  {p.is_outlier ? (
                    <span className="px-2 py-0.5 bg-orange-950 text-orange-400 border border-orange-800 rounded text-[10px] font-bold">
                      OUTLIER
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-[10px]">
                      WITHIN NORMS
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
