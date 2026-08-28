import React from 'react';
import { Card } from '../common/Card';
import { BaselineMetric } from '../../types/security';
import { Activity, ArrowUpRight } from 'lucide-react';

interface BaselineComparisonProps {
  metrics: BaselineMetric[];
}

export const BaselineComparison: React.FC<BaselineComparisonProps> = ({ metrics }) => {
  return (
    <Card surface="cream">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--snt-cream-200)] mb-4">
        <div>
          <h3 className="snt-heading text-sm text-[var(--snt-cream-text)] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 opacity-70" />
            Behavioural Baseline (USP 2)
          </h3>
          <p className="text-[10px] text-[var(--snt-cream-muted)] font-['IBM_Plex_Sans',sans-serif] mt-0.5">Historical 30-day user baseline vs today's telemetry</p>
        </div>
        <span className="px-1.5 py-0.5 text-[9px] bg-[#1f0c0c] text-[#d44f4f] border border-[#5c1a1a] rounded-sm font-mono font-bold tracking-wider">
          DEVIATION DETECTED
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="snt-table-cream w-full text-left">
          <thead>
            <tr>
              <th className="pb-2">Metric</th>
              <th className="pb-2">30-Day Normal</th>
              <th className="pb-2 font-bold text-[var(--snt-cream-text)]">Current Execution</th>
              <th className="pb-2 text-center">Variance / Spike</th>
              <th className="pb-2 text-right">Evaluation</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px]">
            {metrics.map((m, idx) => (
              <tr key={idx}>
                <td className="py-2.5 font-sans font-semibold border-l-2 border-transparent" style={m.is_anomalous ? { borderLeftColor: '#d44f4f' } : {}}>
                  <span className="pl-1.5">{m.metric}</span>
                </td>
                <td className="py-2.5 text-[var(--snt-cream-muted)]">{m.normal_value}</td>
                <td className="py-2.5 font-bold text-[var(--snt-cream-text)]">{m.current_value}</td>
                <td className="py-2.5 text-center">
                  <span className="inline-flex items-center gap-0.5 text-[#d44f4f] font-bold">
                    <ArrowUpRight className="w-3 h-3" />
                    +{m.deviation_percentage}%
                  </span>
                </td>
                <td className="py-2.5 text-right font-sans">
                  {m.is_anomalous ? (
                    <span className="px-1.5 py-0.5 bg-[#1f0c0c] text-[#d44f4f] border border-[#5c1a1a] rounded-sm text-[9px] font-bold uppercase tracking-wider">
                      ANOMALOUS
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-[#081510] text-[#3a9460] border border-[#1a4530] rounded-sm text-[9px] font-bold uppercase tracking-wider">
                      NORMAL
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
