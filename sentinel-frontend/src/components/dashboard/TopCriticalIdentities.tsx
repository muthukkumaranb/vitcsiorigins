import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useNavigate } from 'react-router-dom';
import { Identity } from '../../types/security';
import { ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

interface TopCriticalIdentitiesProps {
  identities: Identity[];
}

export const TopCriticalIdentities: React.FC<TopCriticalIdentitiesProps> = ({ identities }) => {
  const navigate = useNavigate();

  // Sort by highest risk score
  const topIdentities = [...identities]
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 5);

  return (
    <Card className="col-span-full lg:col-span-7">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Top Critical Privileged Identities
          </h2>
          <p className="text-xs text-gray-400">Highest risk scores requiring immediate SOC intervention</p>
        </div>
        <button
          onClick={() => navigate('/identities')}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
        >
          View All ({identities.length})
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1f293d] text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="pb-3 px-2">Identity</th>
              <th className="pb-3 px-2">Role</th>
              <th className="pb-3 px-2 text-center">Risk</th>
              <th className="pb-3 px-2 text-center">Trust</th>
              <th className="pb-3 px-2">Status</th>
              <th className="pb-3 px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f293d]/50">
            {topIdentities.map((item) => (
              <tr
                key={item.user_id}
                onClick={() => navigate(`/investigation/${item.user_id}`)}
                className="hover:bg-[#161f30] cursor-pointer transition-colors group"
              >
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-cyan-400 text-xs shrink-0">
                      {item.user_id.substring(0, 4)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-200 group-hover:text-cyan-300 transition-colors">
                        {item.user_id}
                      </div>
                      <div className="text-[10px] text-gray-400">{item.name}</div>
                    </div>
                  </div>
                </td>

                <td className="py-3 px-2">
                  <div className="font-medium text-gray-300">{item.role}</div>
                  <div className="text-[10px] text-gray-400">{item.department}</div>
                </td>

                <td className="py-3 px-2 text-center">
                  <span
                    className={clsx(
                      'font-mono font-extrabold px-2 py-0.5 rounded text-xs',
                      item.risk_score >= 80
                        ? 'bg-red-950/80 text-red-400 border border-red-800'
                        : item.risk_score >= 60
                        ? 'bg-orange-950/80 text-orange-400 border border-orange-800'
                        : 'bg-yellow-950/80 text-yellow-400 border border-yellow-800'
                    )}
                  >
                    {item.risk_score}
                  </span>
                </td>

                <td className="py-3 px-2 text-center">
                  <span className="font-mono text-gray-300">{item.trust_score} / 100</span>
                </td>

                <td className="py-3 px-2">
                  <Badge variant="risk" riskLevel={item.status === 'CRITICAL' ? 'CRITICAL' : item.status === 'UNDER_INVESTIGATION' ? 'HIGH' : 'MEDIUM'}>
                    {item.status}
                  </Badge>
                </td>

                <td className="py-3 px-2 text-right">
                  <span className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-md group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                    Investigate
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
