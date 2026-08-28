import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Activity } from 'lucide-react';

interface TrustLandscapeChartProps {
  data: { timestamp: string; trust_score: number; anomaly_count: number }[];
}

export const TrustLandscapeChart: React.FC<TrustLandscapeChartProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | '30D'>('24H');

  return (
    <div className="snt-panel col-span-full lg:col-span-8 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[var(--snt-navy-700)] text-[var(--snt-text-primary)] rounded-sm border border-[var(--snt-navy-500)]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="snt-heading text-sm">Behavioural Trust Over Time</h2>
            <p className="text-[10px] text-[var(--snt-text-tertiary)] font-mono mt-0.5 tracking-wide">CONTINUOUS ENTERPRISE SCORE BASELINE (0–100 SCALE)</p>
          </div>
        </div>

        {/* Time Selector */}
        <div className="flex items-center p-0.5 bg-[var(--snt-navy-950)] border border-[var(--snt-navy-500)] rounded-sm text-[10px] font-semibold uppercase tracking-wider font-['IBM_Plex_Sans',sans-serif]">
          {(['24H', '7D', '30D'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-sm transition-colors cursor-pointer ${
                timeRange === range
                  ? 'bg-[var(--snt-navy-700)] text-[var(--snt-text-primary)] border border-[var(--snt-navy-400)]'
                  : 'text-[var(--snt-text-tertiary)] hover:text-[var(--snt-text-secondary)] border border-transparent'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="trustGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f7099" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f7099" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9b2c2c" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#9b2c2c" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="var(--snt-navy-500)" vertical={false} />
            <XAxis dataKey="timestamp" stroke="var(--snt-text-tertiary)" fontSize={10} tickLine={false} fontFamily="'IBM Plex Mono', monospace" />
            <YAxis stroke="var(--snt-text-tertiary)" fontSize={10} domain={[0, 100]} tickLine={false} fontFamily="'IBM Plex Mono', monospace" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--snt-navy-800)',
                borderColor: 'var(--snt-navy-500)',
                borderRadius: '2px',
                color: 'var(--snt-text-primary)',
                fontSize: '11px',
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}
              formatter={(val: any, name: any) => [
                name === 'trust_score' ? `${val} / 100` : val,
                name === 'trust_score' ? 'Behavioural Trust' : 'Anomalies'
              ]}
            />
            <Area
              type="monotone"
              dataKey="trust_score"
              stroke="#4f7099"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#trustGradient)"
              name="trust_score"
            />
            <Area
              type="monotone"
              dataKey="anomaly_count"
              stroke="#9b2c2c"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              fillOpacity={1}
              fill="url(#anomalyGradient)"
              name="anomaly_count"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-end gap-6 mt-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--snt-text-tertiary)' }}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-0.5 bg-[var(--snt-accent)] rounded-sm" />
          <span>Trust Baseline Score</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-0.5 bg-[var(--snt-critical-text)] rounded-sm" style={{ borderBottom: '1px dashed var(--snt-critical-text)' }} />
          <span>Anomaly Activity Spike</span>
        </div>
      </div>
    </div>
  );
};
