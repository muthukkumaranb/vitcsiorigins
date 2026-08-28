import React, { useState } from 'react';
import { useThreatsData } from '../hooks/useSecurityData';
import { ThreatFilters } from '../components/threats/ThreatFilters';
import { ThreatCard } from '../components/threats/ThreatCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { ShieldAlert } from 'lucide-react';

export const ThreatCenter: React.FC = () => {
  const { data: threats, isLoading, isError, refetch } = useThreatsData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedAccountType, setSelectedAccountType] = useState('ALL');

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError || !threats) return <ErrorState onRetry={() => refetch()} />;

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
      <div className="flex items-center justify-between border-b border-[#1f293d] pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-100 uppercase flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            DETECTION — Threat Center
          </h1>
          <p className="text-xs text-gray-400">
            Active privileged access threats requiring incident triage & investigation
          </p>
        </div>

        <div className="text-xs font-mono text-gray-400 bg-[#111827] border border-[#1f293d] px-3 py-1.5 rounded-lg">
          SHOWING: <span className="text-cyan-400 font-bold">{filteredThreats.length}</span> OF {threats.length} THREATS
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

      {/* Threat Cards Grid */}
      {filteredThreats.length > 0 ? (
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
