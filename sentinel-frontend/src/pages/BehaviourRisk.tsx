import React from 'react';
import { useAnalyticsData, useDashboardData, useIdentitiesData } from '../hooks/useSecurityData';
import { TrustLandscapeChart } from '../components/dashboard/TrustLandscapeChart';
import { ThreatOverview } from '../components/dashboard/ThreatOverview';
import { TopCriticalIdentities } from '../components/dashboard/TopCriticalIdentities';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { Activity, ShieldAlert, TrendingDown, RefreshCw } from 'lucide-react';
import { KpiCard } from '../components/dashboard/KpiCard';

export const BehaviourRisk: React.FC = () => {
  const dashboardQuery = useDashboardData();
  const analyticsQuery = useAnalyticsData();
  const identitiesQuery = useIdentitiesData();

  const handleRefresh = () => {
    dashboardQuery.refetch();
    analyticsQuery.refetch();
    identitiesQuery.refetch();
  };

  const metrics = dashboardQuery.data || {
    behavioural_trust_score: 92,
    behavioural_trust_trend: 0,
    active_threats: 3,
    active_threats_trend: 0,
    privileged_identities: 5,
    privileged_identities_trend: 0,
    events_analyzed: 412,
    events_analyzed_trend: 0,
    threat_severity_counts: { critical: 2, high: 6, medium: 12, low: 392 },
    trust_landscape: [],
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-100 dark:text-gray-100 light:text-slate-900 uppercase flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            INTELLIGENCE — Behaviour &amp; Risk Intelligence
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-slate-500">
            Multimodel risk fusion, baseline behavioral anomaly scoring &amp; identity risk distribution
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="p-1.5 text-gray-400 hover:text-cyan-400 bg-[#111827] dark:bg-[#111827] light:bg-slate-100 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg transition-colors self-start sm:self-auto"
          title="Refresh Metrics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Top Behaviour & Risk KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="ENTERPRISE TRUST"
          value={`${metrics.behavioural_trust_score} / 100`}
          subtitle="Continuous Behavioral Trust"
          accentColor="cyan"
          icon={<Activity className="w-5 h-5 text-cyan-400" />}
        />
        <KpiCard
          title="CRITICAL RISKS"
          value={metrics.threat_severity_counts.critical}
          subtitle="Severity >= 80"
          accentColor="red"
          icon={<ShieldAlert className="w-5 h-5 text-red-400" />}
        />
        <KpiCard
          title="HIGH DEVIATIONS"
          value={metrics.threat_severity_counts.high}
          subtitle="Severity >= 50"
          accentColor="amber"
          icon={<TrendingDown className="w-5 h-5 text-amber-400" />}
        />
      </div>

      {/* Trust Landscape Timeline Chart */}
      {dashboardQuery.isLoading && !dashboardQuery.data ? (
        <LoadingSkeleton rows={6} />
      ) : dashboardQuery.isError && !dashboardQuery.data ? (
        <ErrorState onRetry={handleRefresh} />
      ) : (
        <TrustLandscapeChart data={metrics.trust_landscape} />
      )}

      {/* Threat Distribution & Top Identities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ThreatOverview counts={metrics.threat_severity_counts} />
        </div>

        <div className="lg:col-span-2">
          <TopCriticalIdentities identities={identitiesQuery.data || []} />
        </div>
      </div>
    </div>
  );
};
