import React from 'react';
import { useDashboardData, useIdentitiesData, useEventsData } from '../hooks/useSecurityData';
import { KpiCard } from '../components/dashboard/KpiCard';
import { TrustLandscapeChart } from '../components/dashboard/TrustLandscapeChart';
import { ThreatOverview } from '../components/dashboard/ThreatOverview';
import { LiveBehaviourStream } from '../components/dashboard/LiveBehaviourStream';
import { TopCriticalIdentities } from '../components/dashboard/TopCriticalIdentities';
import { ShieldCheck, Activity, Users, AlertTriangle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData();
  const { data: identities, isLoading: isIdentitiesLoading } = useIdentitiesData();
  const { data: events, isLoading: isEventsLoading } = useEventsData();

  if (isDashboardLoading || !dashboardData || isIdentitiesLoading || isEventsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--snt-accent)] border-t-transparent rounded-full animate-spin"></div>
          <div className="snt-label text-[var(--snt-accent)]">INITIALIZING TELEMETRY...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">
      
      {/* Page Header */}
      <div className="flex items-end justify-between pb-4 border-b border-[var(--snt-navy-500)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--snt-text-primary)] font-['Space_Grotesk',sans-serif] tracking-tight">Security Posture Dashboard</h1>
          <p className="text-xs text-[var(--snt-text-secondary)] mt-1 font-['IBM_Plex_Sans',sans-serif]">
            Continuous trust evaluation across {dashboardData.privileged_identities.toLocaleString()} privileged identities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-[var(--snt-navy-750)] border border-[var(--snt-navy-500)] rounded-sm text-[10px] uppercase font-bold tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--snt-safe-text)] animate-pulse-live"></span>
            All Systems Nominal
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Privileged Identities"
          value={dashboardData.privileged_identities.toLocaleString()}
          trend={dashboardData.privileged_identities_trend}
          icon={<Users />}
          accentColor="cyan"
        />
        <KpiCard
          title="Behavioural Trust Score"
          value={`${dashboardData.behavioural_trust_score} / 100`}
          trend={dashboardData.behavioural_trust_trend}
          icon={<ShieldCheck />}
          accentColor="cyan"
        />
        <KpiCard
          title="Active Threats"
          value={dashboardData.active_threats}
          trend={dashboardData.active_threats_trend}
          icon={<AlertTriangle />}
          accentColor="red"
        />
        <KpiCard
          title="Events Analyzed"
          value={dashboardData.events_analyzed.toLocaleString()}
          trend={dashboardData.events_analyzed_trend}
          icon={<Activity />}
          accentColor="emerald"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <TrustLandscapeChart data={dashboardData.trust_landscape} />
        <ThreatOverview counts={dashboardData.threat_severity_counts} />
        <TopCriticalIdentities identities={identities || []} />
        <LiveBehaviourStream events={events || []} />
      </div>

    </div>
  );
};

