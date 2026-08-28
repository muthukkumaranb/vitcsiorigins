import React from 'react';
import { Card } from '../common/Card';
import { AuditLogEntry } from '../../types/security';
import { FileCheck, ShieldCheck, Clock, User } from 'lucide-react';
import { clsx } from 'clsx';

interface AuditTableProps {
  logs: AuditLogEntry[];
}

export const AuditTable: React.FC<AuditTableProps> = ({ logs }) => {
  return (
    <Card>
      <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-400" />
            Response Action Audit Trail
          </h3>
          <p className="text-xs text-gray-400">Immutable ledger of analyst enforcement & automated response actions</p>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 border border-cyan-800 bg-cyan-950/60 px-2 py-0.5 rounded">
          IMMUTABLE LOGS
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#0b0f17] border-b border-[#1f293d] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">Timestamp</th>
              <th className="py-3 px-3">Analyst / Engine</th>
              <th className="py-3 px-3">Identity</th>
              <th className="py-3 px-3">Action Enforced</th>
              <th className="py-3 px-3">Justification / Reason</th>
              <th className="py-3 px-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f293d]/50 font-mono">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-[#161f30] transition-colors">
                <td className="py-3 px-3 text-gray-400 text-[11px] shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>{log.timestamp}</span>
                  </div>
                </td>

                <td className="py-3 px-3 font-sans text-gray-300 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{log.analyst}</span>
                  </div>
                </td>

                <td className="py-3 px-3 font-bold text-cyan-300">
                  {log.identity_id}
                </td>

                <td className="py-3 px-3">
                  <span
                    className={clsx(
                      'px-2 py-0.5 rounded font-black text-[10px] uppercase border tracking-wider',
                      log.action.includes('SUSPEND')
                        ? 'bg-red-950 text-red-400 border-red-800'
                        : log.action.includes('RESTRICT')
                        ? 'bg-orange-950 text-orange-400 border-orange-800'
                        : log.action.includes('VERIFY')
                        ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                        : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    )}
                  >
                    {log.action}
                  </span>
                </td>

                <td className="py-3 px-3 font-sans text-gray-300 max-w-xs truncate">
                  {log.reason}
                </td>

                <td className="py-3 px-3 text-right font-sans">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {log.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
