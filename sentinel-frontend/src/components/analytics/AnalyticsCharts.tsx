import React, { useState } from 'react';
import { Card } from '../common/Card';
import { AnalyticsData } from '../../types/security';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Layers } from 'lucide-react';

interface AnalyticsChartsProps {
  data: AnalyticsData;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Behaviour' | 'Financial' | 'Privilege' | 'Model'
  >('Overview');

  const COLORS = ['#ef4444', '#f97316', '#06b6d4', '#10b981', '#a855f7'];

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-[#1f293d] pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-gray-100">Security Analytics Intelligence</h2>
        </div>

        <div className="flex items-center p-1 bg-[#111827] border border-[#1f293d] rounded-lg text-xs font-semibold">
          {(['Overview', 'Behaviour', 'Financial', 'Privilege', 'Model'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk by Role Chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Average Risk Score by Role
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">PEER DEVIATION</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.risk_by_role} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" horizontal={false} />
                <XAxis type="number" stroke="#6b7280" fontSize={11} domain={[0, 100]} />
                <YAxis dataKey="role" type="category" stroke="#9ca3af" fontSize={11} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#1f293d',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '12px'
                  }}
                  formatter={(val: any) => [`${val} / 100`, 'Avg Risk Score']}
                />
                <Bar dataKey="avg_risk" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Anomaly Trend Chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-400" />
              7-Day Anomaly Frequency Trend
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">DAILY ANOMALIES</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.anomalies_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#1f293d',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="anomalies"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ fill: '#ef4444', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Risk by Account Type */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-400" />
              Risk Distribution Across Account Types
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">ENTITIES SCORED</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.risk_by_account_type}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="avg_risk"
                  >
                    {data.risk_by_account_type.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: '#1f293d',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {data.risk_by_account_type.map((item, idx) => (
                <div
                  key={item.account_type}
                  className="flex items-center justify-between p-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-semibold text-gray-200">{item.account_type}</span>
                  </div>
                  <div className="font-mono font-bold text-gray-100">
                    {item.avg_risk} avg risk <span className="text-gray-500 font-normal">({item.count} accts)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
