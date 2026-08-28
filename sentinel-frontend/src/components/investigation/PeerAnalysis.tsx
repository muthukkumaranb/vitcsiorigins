import React from 'react';
import { Card } from '../common/Card';
import { PeerComparisonMetric } from '../../types/security';
import { Users } from 'lucide-react';

interface PeerAnalysisProps {
  peerMetrics: PeerComparisonMetric[];
  peerGroup: string;
}

export const PeerAnalysis: React.FC<PeerAnalysisProps> = ({ peerMetrics, peerGroup }) => {
  return (
    <Card surface="cream">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--snt-cream-200)] mb-4">
        <div>
          <h3 className="snt-heading text-sm text-[var(--snt-cream-text)] uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 opacity-70" />
            Peer Group Analysis (USP 4)
          </h3>
          <p className="text-[10px] text-[var(--snt-cream-muted)] font-['IBM_Plex_Sans',sans-serif] mt-0.5">Comparing user actions against peer cohort ({peerGroup})</p>
        </div>
        <span className="px-1.5 py-0.5 text-[9px] bg-[#1c0f06] text-[#d07040] border border-[#6b3010] rounded-sm font-mono font-bold tracking-wider">
          EXTREME OUTLIER
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="snt-table-cream w-full text-left">
          <thead>
            <tr>
              <th className="pb-2">Metric</th>
              <th className="pb-2 text-[var(--snt-cream-text)] font-bold">User (U0345)</th>
              <th className="pb-2">Peer Group Median</th>
              <th className="pb-2 text-center">Cohort Variance</th>
              <th className="pb-2 text-right">Outlier Status</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px]">
            {peerMetrics.map((p, idx) => (
              <tr key={idx}>
                <td className="py-2.5 font-sans font-semibold border-l-2 border-transparent" style={p.is_outlier ? { borderLeftColor: '#d07040' } : {}}>
                  <span className="pl-1.5">{p.metric}</span>
                </td>
                <td className="py-2.5 font-bold text-[var(--snt-cream-text)]">{p.user_value}</td>
                <td className="py-2.5 text-[var(--snt-cream-muted)]">{p.peer_median}</td>
                <td className="py-2.5 text-center font-bold text-[#d07040]">{p.variance}</td>
                <td className="py-2.5 text-right font-sans">
                  {p.is_outlier ? (
                    <span className="px-1.5 py-0.5 bg-[#1c0f06] text-[#d07040] border border-[#6b3010] rounded-sm text-[9px] font-bold uppercase tracking-wider">
                      OUTLIER
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 border border-[var(--snt-cream-200)] text-[var(--snt-cream-muted)] rounded-sm text-[9px] font-bold uppercase tracking-wider">
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
