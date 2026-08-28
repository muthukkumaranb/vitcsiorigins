import React from 'react';
import { useAuditLogsData } from '../hooks/useSecurityData';
import { AuditTable } from '../components/audit/AuditTable';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { FileCheck } from 'lucide-react';

export const Audit: React.FC = () => {
  const { data: logs, isLoading, isError, refetch } = useAuditLogsData();

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError || !logs) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#1f293d] pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-100 uppercase flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-cyan-400" />
            RESPONSE — Audit & Response Ledger
          </h1>
          <p className="text-xs text-gray-400">
            Immutable audit record of all SOC analyst interventions and automated engine mitigations
          </p>
        </div>

        <div className="text-xs font-mono text-gray-400 bg-[#111827] border border-[#1f293d] px-3 py-1.5 rounded-lg">
          TOTAL LOGGED: <span className="text-cyan-400 font-bold">{logs.length}</span> AUDIT ENTRIES
        </div>
      </div>

      <AuditTable logs={logs} />
    </div>
  );
};
