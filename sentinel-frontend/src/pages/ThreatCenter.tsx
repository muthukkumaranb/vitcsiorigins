import React, { useState } from 'react';
import { useThreatsData } from '../hooks/useSecurityData';
import { ThreatFilters } from '../components/threats/ThreatFilters';
import { ThreatCard } from '../components/threats/ThreatCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export const ThreatCenter: React.FC = () => {
  const { data: threats = [], isLoading, isError, refetch } = useThreatsData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedAccountType, setSelectedAccountType] = useState('ALL');

  const filteredThreats = threats.filter((t) => {
    const matchesSearch =
      t.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.primary_reasons.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRisk = selectedRisk === 'ALL' || t.risk_level === selectedRisk;
    const matchesRole = selectedRole === 'ALL' || t.role === selectedRole;
    const matchesAccount = selectedAccountType === 'ALL' || t.account_type === selectedAccountType;

    return matchesSearch && matchesRisk && matchesRole && matchesAccount;
  });

  const handleReset = () => {
    setSearchTerm('');
    setSelectedRisk('ALL');
    setSelectedRole('ALL');
    setSelectedAccountType('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-100 dark:text-gray-100 light:text-slate-900 uppercase flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            DETECTION — Threat Center
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-slate-500">
            Active privileged access threats requiring incident triage &amp; investigation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-gray-400 dark:text-gray-400 light:text-slate-600 bg-[#111827] dark:bg-[#111827] light:bg-slate-100 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 px-3 py-1.5 rounded-lg">
            SHOWING: <span className="text-cyan-400 font-bold">{filteredThreats.length}</span> OF {threats.length} THREATS
          </div>

          <button
            onClick={() => refetch()}
            className="p-1.5 text-gray-400 hover:text-cyan-400 bg-[#111827] dark:bg-[#111827] light:bg-slate-100 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg transition-colors"
            title="Refresh Threats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <ThreatFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedRisk={selectedRisk}
        onRiskChange={setSelectedRisk}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        selectedAccountType={selectedAccountType}
        onAccountTypeChange={setSelectedAccountType}
        onReset={handleReset}
      />

      {/* Content Area with Non-Blocking Loading/Error Handling */}
      {isLoading && threats.length === 0 ? (
        <LoadingSkeleton rows={6} />
      ) : isError && threats.length === 0 ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filteredThreats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThreats.map((threat) => (
            <ThreatCard key={threat.threat_id} threat={threat} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Matching Threat Telemetry"
          description="Try clearing your search query or selecting 'All Risk Levels'."
        />
      )}
    </div>
  );
};
