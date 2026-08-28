import React, { useState } from 'react';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { SecurityEvent } from '../../types/security';
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
  events: SecurityEvent[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

interface ChartPoint {
  timestamp: string;
  score: number;
  event_id: string;
  event_type: string;
  user_id: string;
  severity: SecurityEvent['risk_level'];
  metric_label: string;
}

export const TrustLandscapeChart: React.FC<TrustLandscapeChartProps> = ({ data, events, isLoading, isError, onRetry }) => {
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | '30D'>('24H');
  const eventData: ChartPoint[] = events
    .filter((event) => typeof event.risk_score === 'number')
    .sort((first, second) => first.timestamp.localeCompare(second.timestamp))
    .map((event) => ({
      timestamp: event.timestamp,
      score: event.risk_score as number,
      event_id: event.event_id,
      event_type: event.event_type,
      user_id: event.user_id,
      severity: event.risk_level,
      metric_label: 'Event risk score'
    }));
  const chartData = eventData.length > 0 ? eventData : data.map((point) => ({
    timestamp: point.timestamp,
    score: point.trust_score,
    event_id: 'Dashboard aggregate',
    event_type: 'Existing dashboard series',
    user_id: 'Aggregate',
    severity: 'LOW' as const,
    metric_label: 'Trust fixture'
  }));
  const plottedData: ChartPoint[] = eventData.length > 0 ? eventData : chartData;
  const usingEventRisk = eventData.length > 0;

  return (
    <Card className="col-span-full lg:col-span-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">Behavioural Trust Over Time</h2>
            <p className="text-xs text-gray-400">{usingEventRisk ? 'Runtime event risk score, chronological (0–100)' : 'Existing dashboard trust fixture (0–100)'}</p>
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

      {isLoading ? <div className="h-64 animate-pulse rounded-lg bg-gray-800/40" /> : isError ? <ErrorState message="Unable to load runtime event history." onRetry={onRetry} /> : chartData.length === 0 ? <EmptyState title="No Event History" description="No scored runtime events are available for this view." /> : <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={plottedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as (typeof plottedData)[number];
                return <div className="bg-[#111827] border border-[#1f293d] rounded-lg p-3 text-xs text-gray-200 shadow-lg">
                  <div className="font-mono text-gray-400">{label}</div>
                  <div className="font-semibold mt-1">{point.metric_label}: {point.score} / 100</div>
                  <div className="text-gray-400 mt-1">{point.event_id} · {point.user_id}</div>
                  <div className="text-gray-400">{point.event_type} · {point.severity}</div>
                </div>;
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#trustGradient)"
              name="score"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>}

      <div className="flex items-center justify-end gap-6 mt-3 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
          <span>{usingEventRisk ? 'Runtime Event Risk' : 'Existing Trust Fixture'}</span>
        </div>
      </div>
    </Card>
  );
};
