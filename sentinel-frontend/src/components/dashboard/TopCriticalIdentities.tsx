import React from 'react';
import { Card } from '../common/Card';
import { Identity } from '../../types/security';
import { SecurityEvent } from '../../types/security';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';

export const TopCriticalIdentities: React.FC<{ identities: Identity[]; events: SecurityEvent[]; isLoading?: boolean; isError?: boolean; onRetry?: () => void }> = ({ identities, events, isLoading, isError, onRetry }) => {
  const explicitPrivilege = identities.some((identity) => identity.privilege_level !== 'NOT_AVAILABLE');
  const rows = identities.map((identity) => {
    const userEvents = events.filter((event) => event.user_id === identity.user_id);
    const latest = [...userEvents].sort((first, second) => second.timestamp.localeCompare(first.timestamp))[0];
    return { identity, eventCount: userEvents.length, latest, sequence: userEvents.some((event) => event.sequence?.chain_detected), risk: latest?.risk_score ?? identity.risk_score };
  }).sort((first, second) => (second.risk ?? -1) - (first.risk ?? -1)).slice(0, 5);

  return (
  <Card className="col-span-full lg:col-span-7">
    <h2 className="text-base font-bold text-gray-100">{explicitPrivilege ? 'Privileged Identities' : 'Monitored Identities'}</h2>
    <p className="text-xs text-gray-400 mt-1">{explicitPrivilege ? 'Identities with explicit privilege metadata.' : 'Production data does not classify privilege; ranked by observed runtime risk.'}</p>
    {isLoading ? <div className="h-48 animate-pulse rounded-lg bg-gray-800/40 mt-4" /> : isError ? <div className="mt-4"><ErrorState message="Unable to load identity records." onRetry={onRetry} /></div> : rows.length === 0 ? <div className="mt-4"><EmptyState title="No Identities" description="No identity records are available from the runtime source." /></div> :
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-left text-xs">
        <thead><tr className="border-b border-[#1f293d] text-gray-400 uppercase text-[10px]"><th className="pb-3 px-2">Identity</th><th className="pb-3 px-2">Role</th><th className="pb-3 px-2">Latest Risk</th><th className="pb-3 px-2">Events</th><th className="pb-3 px-2">Last Activity</th></tr></thead>
        <tbody>{rows.map(({ identity, eventCount, latest, sequence, risk }) => <tr key={identity.user_id} className="border-b border-[#1f293d]/50"><td className="py-3 px-2"><div className="font-mono text-gray-200">{identity.user_id}</div><Badge variant="risk" riskLevel={latest?.risk_level}>{latest?.risk_level || 'NO DATA'}</Badge></td><td className="py-3 px-2 text-gray-300">{identity.role}</td><td className="py-3 px-2 font-mono">{risk ?? 'N/A'}</td><td className="py-3 px-2">{eventCount}{sequence && <span className="block text-amber-400">Sequence</span>}</td><td className="py-3 px-2 text-gray-400">{latest?.timestamp || identity.last_activity || 'N/A'}</td></tr>)}</tbody>
      </table>
    </div>
    }
  </Card>
  );
};
