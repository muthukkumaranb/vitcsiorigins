import React from 'react';
import { KpiCard } from '../components/dashboard/KpiCard';
import { TrustLandscapeChart } from '../components/dashboard/TrustLandscapeChart';
import { ThreatOverview } from '../components/dashboard/ThreatOverview';
import { TopCriticalIdentities } from '../components/dashboard/TopCriticalIdentities';
import { LiveBehaviourStream } from '../components/dashboard/LiveBehaviourStream';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { useDashboardData, useIdentitiesData } from '../hooks/useSecurityData';
import { useLiveBehaviourStream } from '../hooks/usePolling';
import { Activity, ShieldAlert, Users, Layers } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const dashboardQuery = useDashboardData();
  const identitiesQuery = useIdentitiesData();
  const streamQuery = useLiveBehaviourStream();
  const { stream } = streamQuery;

  if (dashboardQuery.isLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return <ErrorState onRetry={() => dashboardQuery.refetch()} />;
  }

  const metrics = dashboardQuery.data;
  const hasExplicitPrivilege = (identitiesQuery.data || []).some((identity) => identity.privilege_level !== 'NOT_AVAILABLE');

  return (
    <div className="space-y-6">
      {/* Top Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#1f293d] pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-100 uppercase">
            COMMAND CENTER — Security Posture
          </h1>
          <p className="text-xs text-gray-400">
            CSV-backed privileged behavior and trust scoring telemetry
          </p>
        </div>
      </div>

      {/* Section 8: Security Posture KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="BEHAVIOURAL TRUST"
          value={`${metrics.behavioural_trust_score} / 100`}
          subtitle="Enterprise Trust Score"
          trend={metrics.behavioural_trust_trend}
          icon={<Activity className="w-5 h-5 text-cyan-400" />}
          accentColor="cyan"
        />

        <KpiCard
          title="ACTIVE THREATS"
          value={metrics.active_threats}
          subtitle="Open Anomaly Incidents"
          trend={metrics.active_threats_trend}
          icon={<ShieldAlert className="w-5 h-5 text-red-400" />}
          accentColor="red"
        />

        <KpiCard
          title={hasExplicitPrivilege ? 'PRIVILEGED IDENTITIES' : 'MONITORED IDENTITIES'}
          value={metrics.privileged_identities}
          subtitle={hasExplicitPrivilege ? 'Explicit privilege metadata' : 'Ranked by observed runtime risk'}
          trend={metrics.privileged_identities_trend}
          icon={<Users className="w-5 h-5 text-amber-400" />}
          accentColor="amber"
        />

        <KpiCard
          title="EVENTS ANALYZED"
          value={metrics.events_analyzed.toLocaleString()}
          subtitle="Scored Telemetry Log Rows"
          trend={metrics.events_analyzed_trend}
          icon={<Layers className="w-5 h-5 text-emerald-400" />}
          accentColor="emerald"
        />
      </div>

      {/* Main Charts Row: Section 9 Trust Landscape + Section 10 Threat Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <TrustLandscapeChart data={metrics.trust_landscape} events={stream} isLoading={streamQuery.isLoading} isError={streamQuery.isError} onRetry={() => streamQuery.refetch()} />
        <ThreatOverview counts={metrics.threat_severity_counts} />
      </div>

      {/* Secondary Row: Section 11 Top Critical Identities + Section 12 Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <TopCriticalIdentities identities={identitiesQuery.data || []} events={stream} isLoading={identitiesQuery.isLoading} isError={identitiesQuery.isError} onRetry={() => identitiesQuery.refetch()} />
        <LiveBehaviourStream events={stream} isLoading={streamQuery.isLoading} isError={streamQuery.isError} onRetry={() => streamQuery.refetch()} />
      </div>
    </div>
  );
};
