import React from 'react';
import { useAnalyticsData } from '../hooks/useSecurityData';
import { AnalyticsCharts } from '../components/analytics/AnalyticsCharts';
import { ModelStatsCard } from '../components/analytics/ModelStatsCard';
import { ModelRegistryPanel } from '../components/analytics/ModelRegistryPanel';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { KpiCard } from '../components/dashboard/KpiCard';
import { BarChart3, ShieldAlert, Layers, CheckCircle2 } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { data: analytics, isLoading, isError, refetch } = useAnalyticsData();

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (isError || !analytics) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f293d] pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-100 uppercase flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            INTELLIGENCE — Security Analytics
          </h1>
          <p className="text-xs text-gray-400">
            Enterprise threat distribution, anomaly trend analysis &amp; ML engine metrics
          </p>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="EVENTS ANALYZED"
          value={`${(analytics.events_analyzed / 1000000).toFixed(2)}M`}
          subtitle="Cumulative Event Telemetry"
          accentColor="cyan"
          icon={<Layers className="w-5 h-5 text-cyan-400" />}
        />

        <KpiCard
          title="ANOMALIES DETECTED"
          value={analytics.anomalies_detected.toLocaleString()}
          subtitle="Isolation Forest Outliers"
          accentColor="red"
          icon={<ShieldAlert className="w-5 h-5 text-red-400" />}
        />

        <KpiCard
          title="AT-RISK IDENTITIES"
          value={analytics.at_risk_identities}
          subtitle="Risk Score > 60"
          accentColor="amber"
          icon={<ShieldAlert className="w-5 h-5 text-amber-400" />}
        />

        <KpiCard
          title="CONFIRMED INCIDENTS"
          value={analytics.confirmed_incidents}
          subtitle="Analyst Verified Threats"
          accentColor="emerald"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        />
      </div>

      {/* Controlled Continuous Learning & Model Registry Panel (Plane B) */}
      <ModelRegistryPanel />

      {/* Model Transparency Section */}
      <ModelStatsCard stats={analytics.model_stats} />

      {/* Analytics Tabbed Charts */}
      <AnalyticsCharts data={analytics} />
    </div>
  );
};
