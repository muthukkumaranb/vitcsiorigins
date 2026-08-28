import React, { useState } from 'react';
import { Identity } from '../../types/security';
import { Badge } from '../common/Badge';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { clsx } from 'clsx';

interface IdentityTableProps {
  identities: Identity[];
}

export const IdentityTable: React.FC<IdentityTableProps> = ({ identities }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = identities.filter((item) => {
    const matchesSearch =
      item.user_id.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.role.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase());

    const matchesAccount = accountTypeFilter === 'ALL' || item.account_type === accountTypeFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesAccount && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-[#111827] border border-[#1f293d] p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search User ID, Name, Role, or Department..."
            className="w-full pl-9 pr-4 py-2 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
              className="bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Account Types</option>
              <option value="Employee">Employee</option>
              <option value="Administrator">Administrator</option>
              <option value="Service Account">Service Account</option>
              <option value="Automated System">Automated System</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="CRITICAL">Critical</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="RESTRICTED">Restricted</option>
            <option value="MONITORED">Monitored</option>
            <option value="ACTIVE">Active</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0b0f17] border-b border-[#1f293d] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Account Type</th>
                <th className="py-3.5 px-4">Role & Department</th>
                <th className="py-3.5 px-4">Privilege</th>
                <th className="py-3.5 px-4 text-center">Trust</th>
                <th className="py-3.5 px-4 text-center">Risk</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50">
              {filtered.map((item) => (
                <tr
                  key={item.user_id}
                  onClick={() => navigate(`/investigation/${item.user_id}`)}
                  className="hover:bg-[#161f30] transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-950/60 border border-cyan-800 flex items-center justify-center font-bold text-cyan-400 text-xs shrink-0">
                        {item.user_id.substring(0, 4)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-200 group-hover:text-cyan-300 transition-colors font-mono">
                          {item.user_id}
                        </div>
                        <div className="text-[11px] text-gray-400">{item.name}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant="account" accountType={item.account_type}>
                      {item.account_type}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-gray-200">{item.role}</div>
                    <div className="text-[10px] text-gray-400">{item.department}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider',
                        item.privilege_level === 'SYSTEM_ADMIN'
                          ? 'bg-purple-950 text-purple-300 border-purple-800'
                          : item.privilege_level === 'HIGH'
                          ? 'bg-red-950 text-red-300 border-red-800'
                          : 'bg-gray-800 text-gray-300 border-gray-700'
                      )}
                    >
                      {item.privilege_level}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-200">
                    {item.trust_score}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded font-mono font-black text-xs border',
                        item.risk_score >= 80
                          ? 'bg-red-950 text-red-400 border-red-800'
                          : item.risk_score >= 60
                          ? 'bg-orange-950 text-orange-400 border-orange-800'
                          : item.risk_score >= 35
                          ? 'bg-yellow-950 text-yellow-400 border-yellow-800'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      )}
                    >
                      {item.risk_score}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">
                    {item.last_activity}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge
                      variant="risk"
                      riskLevel={
                        item.status === 'CRITICAL'
                          ? 'CRITICAL'
                          : item.status === 'UNDER_INVESTIGATION' || item.status === 'RESTRICTED'
                          ? 'HIGH'
                          : item.status === 'MONITORED'
                          ? 'MEDIUM'
                          : 'LOW'
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button className="px-3 py-1 bg-cyan-950 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-800 rounded font-semibold text-xs transition-colors cursor-pointer">
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
