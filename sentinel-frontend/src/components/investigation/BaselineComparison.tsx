import React from 'react';
import { Card } from '../common/Card';
import { BaselineMetric } from '../../types/security';
import { Activity, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface BaselineComparisonProps {
  metrics: BaselineMetric[];
}

export const BaselineComparison: React.FC<BaselineComparisonProps> = ({ metrics }) => {
  return (
    <Card>
      <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Behavioural Baseline (USP 2: Normal vs Current)
          </h3>
          <p className="text-xs text-gray-400">Historical 30-day user baseline vs today's telemetry</p>
        </div>
        <span className="px-2 py-0.5 text-[10px] bg-red-950 text-red-400 border border-red-800 rounded font-mono font-bold">
          DEVIATION DETECTED
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1f293d] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="pb-2 px-3">Metric</th>
              <th className="pb-2 px-3">30-Day Normal</th>
              <th className="pb-2 px-3">Current Execution</th>
              <th className="pb-2 px-3 text-center">Variance / Spike</th>
              <th className="pb-2 px-3 text-right">Evaluation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f293d]/50 font-mono">
            {metrics.map((m, idx) => (
              <tr key={idx} className={m.is_anomalous ? 'bg-red-950/20' : 'hover:bg-[#161f30]'}>
                <td className="py-2.5 px-3 font-sans font-semibold text-gray-200">{m.metric}</td>
                <td className="py-2.5 px-3 text-gray-400">{m.normal_value}</td>
                <td className="py-2.5 px-3 font-bold text-gray-100">{m.current_value}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    +{m.deviation_percentage}%
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-sans">
                  {m.is_anomalous ? (
                    <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded text-[10px] font-bold">
                      ANOMALOUS
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px]">
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
