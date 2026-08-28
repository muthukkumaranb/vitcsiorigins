import React from 'react';
import { LiveBehaviourStream } from '../components/dashboard/LiveBehaviourStream';
import { SimulationControlWidget } from '../components/dashboard/SimulationControlWidget';
import { useDashboardData } from '../hooks/useSecurityData';
import { useLiveBehaviourStream } from '../hooks/usePolling';
import { Radio, RefreshCw, Activity, Layers, ShieldCheck } from 'lucide-react';
import { KpiCard } from '../components/dashboard/KpiCard';

export const RuntimeBehaviour: React.FC = () => {
  const dashboardQuery = useDashboardData();
  const { stream, isLoading, isError, refetch } = useLiveBehaviourStream();

  const handleRefresh = () => {
    dashboardQuery.refetch();
    refetch();
  };

  const streamCount = stream?.length || 0;
  const anomalousCount = stream?.filter((s) => s.risk_level === 'CRITICAL' || s.risk_level === 'HIGH').length || 0;
  const normalCount = stream?.filter((s) => s.risk_level === 'LOW' || s.risk_level === 'MEDIUM').length || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-100 dark:text-gray-100 light:text-slate-900 uppercase flex items-center gap-2">
            <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
            DETECTION — Runtime Behaviour Centre
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-slate-500">
            Real-time event streaming, behavioral baseline deviations &amp; live attack simulation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-gray-400 dark:text-gray-400 light:text-slate-600 bg-[#111827] dark:bg-[#111827] light:bg-slate-100 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>BUFFER: <strong className="text-cyan-400 font-bold">{streamCount}</strong> EVENTS</span>
          </div>

          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-400 hover:text-cyan-400 bg-[#111827] dark:bg-[#111827] light:bg-slate-100 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg transition-colors"
            title="Refresh Stream"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stream Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="STREAM BUFFER"
          value={streamCount}
          subtitle="Active Live Events"
          accentColor="cyan"
          icon={<Layers className="w-5 h-5 text-cyan-400" />}
        />
        <KpiCard
          title="ANOMALOUS EVENTS"
          value={anomalousCount}
          subtitle="Baseline Divergent"
          accentColor="red"
          icon={<Activity className="w-5 h-5 text-red-400" />}
        />
        <KpiCard
          title="NORMAL EVENTS"
          value={normalCount}
          subtitle="Within Trust Threshold"
          accentColor="emerald"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
        />
      </div>

      {/* Simulation Controls */}
      <SimulationControlWidget onEventIngested={handleRefresh} />

      {/* Live Behaviour Stream Widget */}
      <LiveBehaviourStream events={stream || []} isLoading={isLoading} isError={isError} onRetry={refetch} />
    </div>
  );
};
