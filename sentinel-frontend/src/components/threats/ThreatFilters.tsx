import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';

interface ThreatFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedRisk: string;
  onRiskChange: (val: string) => void;
  selectedRole: string;
  onRoleChange: (val: string) => void;
  selectedAccountType: string;
  onAccountTypeChange: (val: string) => void;
  onReset: () => void;
}

export const ThreatFilters: React.FC<ThreatFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedRisk,
  onRiskChange,
  selectedRole,
  onRoleChange,
  selectedAccountType,
  onAccountTypeChange,
  onReset
}) => {
  return (
    <div className="bg-[#111827] border border-[#1f293d] p-4 rounded-xl mb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search User ID, Name, Role, or Threat Reason..."
            className="w-full pl-9 pr-4 py-2 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Risk Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={selectedRisk}
            onChange={(e) => onRiskChange(e.target.value)}
            className="bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>
        </div>

        {/* Account Type Filter */}
        <select
          value={selectedAccountType}
          onChange={(e) => onAccountTypeChange(e.target.value)}
          className="bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          <option value="ALL">All Account Types</option>
          <option value="Employee">Employee</option>
          <option value="Administrator">Administrator</option>
          <option value="Service Account">Service Account</option>
          <option value="Automated System">Automated System</option>
        </select>

        {/* Role Filter */}
        <select
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value)}
          className="bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          <option value="ALL">All Roles</option>
          <option value="Finance Operations">Finance Operations</option>
          <option value="Core Banking Administrator">Core Banking Admin</option>
          <option value="DevOps & Cloud Infra">DevOps & Cloud Infra</option>
          <option value="Automated Financial Settlement">Automated Settlement</option>
          <option value="Senior Treasury Manager">Senior Treasury Manager</option>
        </select>

        {/* Reset Filter Button */}
        <button
          onClick={onReset}
          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg border border-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Filters
        </button>
      </div>
    </div>
  );
};
