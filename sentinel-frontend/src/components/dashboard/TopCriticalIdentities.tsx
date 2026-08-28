import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Identity } from '../../types/security';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, UserCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { formatIdentityStatus } from '../../utils/formatters';


interface TopCriticalIdentitiesProps {
  identities: Identity[];
}

export const TopCriticalIdentities: React.FC<TopCriticalIdentitiesProps> = ({ identities }) => {
  const navigate = useNavigate();

  const getSeverityLevel = (score?: number) => {
    if (score === undefined) return undefined;
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <Card className="col-span-full lg:col-span-7">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Privileged & At-Risk Identities
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Ranked by evaluated behavioural and sequence risk score
          </p>
        </div>
        <button
          onClick={() => navigate('/identities')}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          View All ({identities.length})
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1f293d] text-gray-400 uppercase text-[10px] font-bold">
              <th className="pb-3 px-3">Identity</th>
              <th className="pb-3 px-3">Role</th>
              <th className="pb-3 px-3 text-center">Risk</th>
              <th className="pb-3 px-3 text-center">Trust</th>
              <th className="pb-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f293d]/50 font-mono">
            {identities.slice(0, 6).map((identity) => {
              const riskLevel = getSeverityLevel(identity.risk_score);
              return (
                <tr
                  key={identity.user_id}
                  onClick={() => identity.top_event_id ? navigate(`/investigation/${identity.top_event_id}`) : navigate('/identities')}
                  className="hover:bg-[#161f30] transition-colors cursor-pointer group"
                >

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-cyan-950 text-cyan-400 rounded border border-cyan-800/60">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-200 group-hover:text-cyan-400 transition-colors">
                          {identity.user_id}
                        </div>
                        <div className="text-[10px] text-gray-500 font-sans">
                          {identity.account_type || 'Employee'}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-sans text-gray-300">
                    <div className="font-medium truncate max-w-[180px]">{identity.role}</div>
                    <div className="text-[10px] text-gray-500">{identity.peer_group}</div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    {identity.risk_score !== undefined ? (
                      <span
                        className={clsx(
                          'font-bold px-2 py-0.5 rounded text-xs',
                          identity.risk_score >= 75
                            ? 'text-red-400 bg-red-950/60 border border-red-800/40'
                            : identity.risk_score >= 50
                            ? 'text-orange-400 bg-orange-950/60 border border-orange-800/40'
                            : identity.risk_score >= 25
                            ? 'text-yellow-400 bg-yellow-950/60 border border-yellow-800/40'
                            : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40'
                        )}
                      >
                        {identity.risk_score}
                      </span>
                    ) : (
                      <span className="text-gray-500 font-sans text-[11px]">Unassessed</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center font-bold text-cyan-300">
                    {identity.trust_score !== undefined ? `${identity.trust_score}` : (
                      <span className="text-gray-500 font-sans font-normal text-[11px]">Unassessed</span>
                    )}
                  </td>


                  <td className="py-3 px-3 text-right">
                    {riskLevel ? (
                      <Badge variant="risk" riskLevel={riskLevel}>
                        {formatIdentityStatus(identity.status || riskLevel)}
                      </Badge>
                    ) : (
                      <span className="text-gray-500 text-[10px]">Active</span>
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
