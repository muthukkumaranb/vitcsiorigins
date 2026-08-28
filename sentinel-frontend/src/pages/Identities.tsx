import React, { useState } from 'react';
import { useIdentitiesData } from '../hooks/useSecurityData';
import { Badge } from '../components/common/Badge';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter } from 'lucide-react';
import { Identity } from '../types/security';

export const Identities: React.FC = () => {
  const { data: allIdentities, isLoading } = useIdentitiesData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading || !allIdentities) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[var(--snt-accent)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const identities = allIdentities.filter((i: Identity) => 
    i.user_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--snt-navy-500)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--snt-text-primary)] font-['Space_Grotesk',sans-serif] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--snt-accent-light)]" />
            Privileged Identities
          </h1>
          <p className="text-xs text-[var(--snt-text-secondary)] mt-1 font-['IBM_Plex_Sans',sans-serif]">
            Directory of all monitored entities with elevated access rights.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[var(--snt-navy-750)] border border-[var(--snt-navy-500)] rounded-sm p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--snt-text-tertiary)]" />
          <input 
            type="text" 
            placeholder="Search by Identity ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--snt-navy-950)] border border-[var(--snt-navy-500)] text-[var(--snt-text-primary)] rounded-sm py-2 pl-9 pr-4 font-mono text-xs focus:outline-none focus:border-[var(--snt-accent)]"
          />
        </div>
        <div className="hidden md:flex items-center gap-2 border-l border-[var(--snt-navy-500)] pl-4 text-[10px] text-[var(--snt-text-tertiary)] uppercase font-bold tracking-widest">
          <Filter className="w-3.5 h-3.5" />
          More Filters
        </div>
      </div>

      {/* Identities Table */}
      <div className="bg-[var(--snt-navy-750)] border border-[var(--snt-navy-500)] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="snt-table w-full text-left">
            <thead>
              <tr>
                <th>Identity</th>
                <th>Role / Dept</th>
                <th>Account Type</th>
                <th className="text-center">Trust Score</th>
                <th className="text-center">Risk Score</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {identities.map((item: Identity) => (
                <tr 
                  key={item.user_id}
                  onClick={() => navigate(`/investigation/${item.user_id}`)}
                  className="cursor-pointer group"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-sm bg-[var(--snt-navy-900)] border border-[var(--snt-navy-500)] flex items-center justify-center font-bold text-[var(--snt-text-primary)] text-xs font-mono shrink-0">
                        {item.user_id.substring(0, 4)}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--snt-text-primary)] font-mono text-xs group-hover:text-[var(--snt-accent-light)] transition-colors">
                          {item.user_id}
                        </div>
                        <div className="text-[11px] text-[var(--snt-text-secondary)]">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-3">
                    <div className="font-medium text-[var(--snt-text-primary)] text-xs">{item.role}</div>
                    <div className="text-[10px] text-[var(--snt-text-tertiary)] uppercase tracking-wider">{item.department}</div>
                  </td>

                  <td className="py-3">
                    <Badge variant="account" accountType={item.account_type}>
                      {item.account_type}
                    </Badge>
                  </td>

                  <td className="py-3 text-center">
                    <span className="font-mono text-xs font-bold text-[var(--snt-text-secondary)]">{item.trust_score}</span>
                  </td>

                  <td className="py-3 text-center">
                    <span className="font-mono text-xs font-bold text-[var(--snt-text-primary)]">{item.risk_score}</span>
                  </td>

                  <td className="py-3">
                    <Badge variant="risk" riskLevel={item.status === 'CRITICAL' ? 'CRITICAL' : item.status === 'UNDER_INVESTIGATION' ? 'HIGH' : 'MEDIUM'}>
                      {item.status}
                    </Badge>
                  </td>

                  <td className="py-3 text-right">
                    <span className="inline-block px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider bg-[var(--snt-navy-800)] text-[var(--snt-text-secondary)] border border-[var(--snt-navy-500)] rounded-sm group-hover:bg-[var(--snt-navy-600)] group-hover:text-[var(--snt-text-primary)] group-hover:border-[var(--snt-navy-400)] transition-colors">
                      Profile
                    </span>
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
