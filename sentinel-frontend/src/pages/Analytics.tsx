import React from 'react';
import { useAnalyticsData } from '../hooks/useSecurityData';
import { AnalyticsCharts } from '../components/analytics/AnalyticsCharts';
import { ModelStatsCard } from '../components/analytics/ModelStatsCard';
import { ModelRegistryPanel } from '../components/analytics/ModelRegistryPanel';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { KpiCard } from '../components/dashboard/KpiCard';
import { AnalyticsData, ModelStats } from '../types/security';
import { BarChart3, ShieldAlert, Layers, CheckCircle2, RefreshCw } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { data: analytics, isLoading, isError, refetch } = useAnalyticsData();

  const defaultModelStats: ModelStats = {
    model_name: 'RandomForestClassifier + IsolationForest',
    version: '2.5.0-hybrid',
    events_scored: 412,
    anomalies_detected: 28,
    anomaly_rate: 0.068,
    last_updated: '2026-08-28T12:00:00Z',
  };

  const defaultAnalytics: AnalyticsData = {
    events_analyzed: 412000,
    anomalies_detected: 28,
    at_risk_identities: 5,
    confirmed_incidents: 4,
    false_positive_rate: 0.024,
    risk_by_role: [
      { role: 'Core DB Admin', avg_risk: 68.4, count: 85 },
      { role: 'Finance Ops', avg_risk: 54.2, count: 120 },
      { role: 'DevOps Lead', avg_risk: 42.1, count: 95 },
      { role: 'Payment Gateway', avg_risk: 18.5, count: 112 },
    ],
    risk_by_account_type: [
      { account_type: 'human', avg_risk: 52.3, count: 280 },
      { account_type: 'service', avg_risk: 28.1, count: 132 },
    ],
    anomalies_trend: [
      { date: '06:00', anomalies: 2, events: 45 },
      { date: '08:00', anomalies: 5, events: 80 },
      { date: '10:00', anomalies: 8, events: 110 },
      { date: '12:00', anomalies: 4, events: 90 },
      { date: '14:00', anomalies: 6, events: 105 },
      { date: '16:00', anomalies: 3, events: 62 },
    ],
    model_stats: defaultModelStats,
  };

  const currentAnalytics = analytics || defaultAnalytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-100 dark:text-gray-100 light:text-slate-900 uppercase flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            INTELLIGENCE — Security Analytics &amp; Posture
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-slate-500">
            Enterprise threat distribution, anomaly trend analysis &amp; ML engine metrics
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="p-1.5 text-gray-400 hover:text-cyan-400 bg-[#111827] dark:bg-[#111827] light:bg-slate-100 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg transition-colors self-start sm:self-auto"
          title="Refresh Analytics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading && !analytics ? (
        <LoadingSkeleton rows={8} />
      ) : isError && !analytics ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="EVENTS ANALYZED"
              value={`${(currentAnalytics.events_analyzed / 1000).toFixed(1)}k`}
              subtitle="Cumulative Event Telemetry"
              accentColor="cyan"
              icon={<Layers className="w-5 h-5 text-cyan-400" />}
            />

            <KpiCard
              title="ANOMALIES DETECTED"
              value={currentAnalytics.anomalies_detected.toLocaleString()}
              subtitle="Isolation Forest Outliers"
              accentColor="red"
              icon={<ShieldAlert className="w-5 h-5 text-red-400" />}
            />

            <KpiCard
              title="AT-RISK IDENTITIES"
              value={currentAnalytics.at_risk_identities}
              subtitle="Risk Score > 60"
              accentColor="amber"
              icon={<ShieldAlert className="w-5 h-5 text-amber-400" />}
            />

            <KpiCard
              title="CONFIRMED INCIDENTS"
              value={currentAnalytics.confirmed_incidents}
              subtitle="Analyst Verified Threats"
              accentColor="emerald"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            />
          </div>

          {/* Controlled Continuous Learning & Model Registry Panel (Plane B) */}
          <ModelRegistryPanel />

          {/* Model Transparency Section */}
          <ModelStatsCard stats={currentAnalytics.model_stats} />

          {/* Analytics Tabbed Charts */}
          <AnalyticsCharts data={currentAnalytics} />
        </>
      )}
    </div>
  );
};
