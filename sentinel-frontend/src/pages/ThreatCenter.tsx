import React, { useState } from 'react';
import { useEventsData } from '../hooks/useSecurityData';
import { Badge } from '../components/common/Badge';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldAlert, Search, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import { SecurityEvent } from '../types/security';

export const ThreatCenter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSeverity = searchParams.get('severity') || 'ALL';
  const { data: events, isLoading } = useEventsData();
  const navigate = useNavigate();
  const [filterSeverity, setFilterSeverity] = useState<string>(initialSeverity);
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading || !events) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[var(--snt-accent)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const threats = events.filter((e: SecurityEvent) => 
    (filterSeverity === 'ALL' || e.risk_level === filterSeverity) &&
    (e.user_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
     e.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
     e.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--snt-navy-500)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--snt-text-primary)] font-['Space_Grotesk',sans-serif] tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[var(--snt-critical-text)]" />
            Active Threat Center
          </h1>
          <p className="text-xs text-[var(--snt-text-secondary)] mt-1 font-['IBM_Plex_Sans',sans-serif]">
            Investigate and respond to prioritized anomalies and behavioral deviations.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[var(--snt-navy-750)] border border-[var(--snt-navy-500)] rounded-sm p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--snt-text-tertiary)]" />
          <input 
            type="text" 
            placeholder="Search by Identity ID or Event Type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--snt-navy-950)] border border-[var(--snt-navy-500)] text-[var(--snt-text-primary)] rounded-sm py-2 pl-9 pr-4 font-mono text-xs focus:outline-none focus:border-[var(--snt-accent)]"
          />
        </div>

        <div className="flex items-center gap-2 border-l border-[var(--snt-navy-500)] pl-4">
          <Filter className="w-4 h-4 text-[var(--snt-text-tertiary)]" />
          <div className="flex items-center p-0.5 bg-[var(--snt-navy-950)] border border-[var(--snt-navy-500)] rounded-sm">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(level => (
              <button
                key={level}
                onClick={() => setFilterSeverity(level)}
                className={clsx(
                  'px-3 py-1 rounded-sm text-[10px] font-bold tracking-wider uppercase transition-colors',
                  filterSeverity === level 
                    ? 'bg-[var(--snt-navy-700)] text-[var(--snt-text-primary)] border border-[var(--snt-navy-400)]'
                    : 'text-[var(--snt-text-tertiary)] hover:text-[var(--snt-text-secondary)] border border-transparent'
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Threats List */}
      <div className="space-y-2">
        {threats.map((evt: SecurityEvent) => (
          <div 
            key={evt.event_id}
            onClick={() => navigate(`/investigation/${evt.user_id}`)}
            className="relative bg-[var(--snt-navy-750)] border border-[var(--snt-navy-500)] p-4 rounded-sm hover:border-[var(--snt-navy-400)] hover:bg-[var(--snt-navy-700)] transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group overflow-hidden"
          >
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 opacity-80 ${
                evt.risk_level === 'CRITICAL' ? 'bg-[var(--snt-critical-text)]' :
                evt.risk_level === 'HIGH' ? 'bg-[var(--snt-high-text)]' :
                evt.risk_level === 'MEDIUM' ? 'bg-[var(--snt-medium-text)]' :
                'bg-[var(--snt-safe-text)]'
              }`}
            />
            
            <div className="flex items-center gap-4 pl-2">
              <div className="font-mono text-[10px] text-[var(--snt-text-tertiary)] whitespace-nowrap">
                {evt.timestamp}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[var(--snt-text-primary)] font-mono text-xs">{evt.user_id}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--snt-text-secondary)]">{evt.event_type}</span>
                </div>
                <div className="text-[11px] text-[var(--snt-text-secondary)]">
                  {evt.description}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 pl-2 md:pl-0">
              {evt.amount && (
                <div className="text-[11px] font-mono font-bold text-[var(--snt-text-primary)]">
                  {evt.amount}
                </div>
              )}
              <Badge variant="risk" riskLevel={evt.risk_level}>
                {evt.risk_level}
              </Badge>
              <div className="px-3 py-1 bg-[var(--snt-navy-800)] border border-[var(--snt-navy-500)] text-[10px] font-bold text-[var(--snt-text-secondary)] rounded-sm group-hover:bg-[var(--snt-navy-600)] group-hover:text-[var(--snt-text-primary)] transition-colors uppercase tracking-wider">
                Investigate
              </div>
            </div>
          </div>
        ))}
        
        {threats.length === 0 && (
          <div className="p-8 text-center bg-[var(--snt-navy-750)] border border-[var(--snt-navy-500)] rounded-sm">
            <ShieldAlert className="w-8 h-8 text-[var(--snt-text-tertiary)] mx-auto mb-2 opacity-50" />
            <p className="text-[var(--snt-text-secondary)] font-['IBM_Plex_Sans',sans-serif]">No threats match current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

