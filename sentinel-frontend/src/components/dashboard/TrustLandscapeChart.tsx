import React, { useState } from 'react';
import { Card } from '../common/Card';
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
    <Card className="col-span-full lg:col-span-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">Behavioural Trust Over Time</h2>
            <p className="text-xs text-gray-400">Continuous enterprise score baseline (0–100 scale)</p>
          </div>
        </div>

        {/* Time Selector */}
        <div className="flex items-center p-1 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-xs font-semibold">
          {(['24H', '7D', '30D'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                timeRange === range
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
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
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#6b7280" fontSize={11} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={11} domain={[0, 100]} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderColor: '#1f293d',
                borderRadius: '8px',
                color: '#f3f4f6',
                fontSize: '12px'
              }}
              formatter={(val: any, name: any) => [
                name === 'trust_score' ? `${val} / 100` : val,
                name === 'trust_score' ? 'Behavioural Trust' : 'Anomalies'
              ]}
            />
            <Area
              type="monotone"
              dataKey="trust_score"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#trustGradient)"
              name="trust_score"
            />
            <Area
              type="monotone"
              dataKey="anomaly_count"
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#anomalyGradient)"
              name="anomaly_count"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-end gap-6 mt-3 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
          <span>Trust Baseline Score</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-red-400 border border-dashed border-red-400 rounded-full" />
          <span>Anomaly Activity Spike</span>
        </div>
      </div>
    </Card>
  );
};
