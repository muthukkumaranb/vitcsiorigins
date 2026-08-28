import React from 'react';
import { useAuditLogsData } from '../hooks/useSecurityData';
import { AuditTable } from '../components/audit/AuditTable';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';

export const Audit: React.FC = () => {
  const { data: logs, isLoading, isError, refetch } = useAuditLogsData();
  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError || !logs) return <ErrorState message="Audit log is not provided by the backend." onRetry={() => refetch()} />;
  return <div className="space-y-6"><div className="border-b border-[#1f293d] pb-4"><h1 className="text-xl font-black text-gray-100 uppercase">Response Audit Log</h1><p className="text-xs text-gray-400">SOC response records. This view is not an immutable ledger.</p></div><AuditTable logs={logs} /></div>;
};
