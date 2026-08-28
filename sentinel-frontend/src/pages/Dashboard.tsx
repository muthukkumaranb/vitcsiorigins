import React from 'react';
import { KpiCard } from '../components/dashboard/KpiCard';
import { TrustLandscapeChart } from '../components/dashboard/TrustLandscapeChart';
import { ThreatOverview } from '../components/dashboard/ThreatOverview';
import { TopCriticalIdentities } from '../components/dashboard/TopCriticalIdentities';
import { LiveBehaviourStream } from '../components/dashboard/LiveBehaviourStream';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { useDashboardData, useIdentitiesData } from '../hooks/useSecurityData';
import { useLiveBehaviourStream } from '../hooks/usePolling';
import { Activity, ShieldAlert, Users, Layers, AlertTriangle, RefreshCw } from 'lucide-react';
import { SimulationControlWidget } from '../components/dashboard/SimulationControlWidget';

export const Dashboard: React.FC = () => {
  const dashboardQuery = useDashboardData();
  const identitiesQuery = useIdentitiesData();
  const { stream, isLoading: isStreamLoading, isError: isStreamError, refetch: refetchStream } = useLiveBehaviourStream();

  const handleDataRefresh = () => {
    dashboardQuery.refetch();
    identitiesQuery.refetch();
    refetchStream();
  };


  const isLoadingInitial = (dashboardQuery.isLoading || identitiesQuery.isLoading) && !dashboardQuery.data;
  if (isLoadingInitial) {
    return (
      <div className="space-y-6">
        <div className="border-b border-[#1f293d] pb-4">
          <h1 className="text-xl font-black tracking-tight text-gray-100 uppercase">
            COMMAND CENTER — Security Posture
          </h1>
          <p className="text-xs text-cyan-400 animate-pulse mt-1">Connecting to SENTINEL runtime telemetry...</p>
        </div>
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

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

  const isTransientError = (dashboardQuery.isError || identitiesQuery.isError) && !!dashboardQuery.data;
  const isCompleteError = dashboardQuery.isError && !dashboardQuery.data;

  return (
    <div className="space-y-6">
      {/* Top Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#1f293d] pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-100 uppercase">
            COMMAND CENTER — Security Posture
          </h1>
          <p className="text-xs text-gray-400">
            Real-time behavioral telemetry, sequence correlation &amp; hybrid ML threat scoring
          </p>
        </div>

        {isTransientError && (
          <div className="flex items-center gap-2 bg-amber-950/70 border border-amber-800 text-amber-300 text-xs px-3 py-1.5 rounded-lg">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Connection temporarily unavailable · Showing cached telemetry</span>
            <button
              onClick={handleDataRefresh}
              className="flex items-center gap-1 font-bold underline hover:text-white ml-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}
      </div>

      {/* Live Telemetry Simulator Control Panel */}
      <SimulationControlWidget onEventIngested={handleDataRefresh} />

      {isCompleteError ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200 uppercase">Connecting to SENTINEL Telemetry</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Unable to reach telemetry backend. Please ensure the backend server is running on port 5000.
          </p>
          <button
            onClick={handleDataRefresh}
            className="inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reconnect Runtime
          </button>
        </div>
      ) : (
        <>
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
              title="PRIVILEGED IDENTITIES"
              value={metrics.privileged_identities}
              subtitle="Monitored High-Trust Accounts"
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

          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <TrustLandscapeChart data={metrics.trust_landscape} />
            <ThreatOverview counts={metrics.threat_severity_counts} />
          </div>

          {/* Secondary Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <TopCriticalIdentities identities={identitiesQuery.data || []} />
            <LiveBehaviourStream
              events={stream}
              isLoading={isStreamLoading}
              isError={isStreamError}
              onRetry={refetchStream}
            />
          </div>

        </>
      )}
    </div>
  );
};
