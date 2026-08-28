import React from 'react';
import { useIdentitiesData } from '../hooks/useSecurityData';
import { IdentityTable } from '../components/identities/IdentityTable';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { Users } from 'lucide-react';

export const Identities: React.FC = () => {
  const { data: identities, isLoading, isError, refetch } = useIdentitiesData();

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (isError || !identities) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#1f293d] pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-100 uppercase flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            DETECTION — Privileged Identities
          </h1>
          <p className="text-xs text-gray-400">
            Enterprise inventory of employee, admin, service account, and automated identities
          </p>
        </div>

        <div className="text-xs font-mono text-gray-400 bg-[#111827] border border-[#1f293d] px-3 py-1.5 rounded-lg">
          TOTAL MONITORED: <span className="text-cyan-400 font-bold">{identities.length}</span> IDENTITIES
        </div>
      </div>

      <IdentityTable identities={identities} />
    </div>
  );
};
