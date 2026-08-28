import React from 'react';
import { Badge } from '../common/Badge';
import { useNavigate } from 'react-router-dom';
import { Identity } from '../../types/security';
import { ArrowRight, ShieldAlert } from 'lucide-react';
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
    <div className="snt-panel-cream col-span-full lg:col-span-7 p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--snt-cream-200)]">
        <div>
          <h2 className="snt-heading text-sm text-[var(--snt-cream-text)] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[var(--snt-critical-text)]" />
            Top Critical Privileged Identities
          </h2>
          <p className="text-[10px] text-[var(--snt-cream-muted)] font-['IBM_Plex_Sans',sans-serif] mt-0.5">Highest risk scores requiring immediate SOC intervention</p>
        </div>
        <button
          onClick={() => navigate('/identities')}
          className="text-[10px] text-[var(--snt-cream-muted)] hover:text-[var(--snt-cream-text)] font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
        >
          View All ({identities.length})
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="snt-table-cream w-full text-left">
          <thead>
            <tr>
              <th>Identity</th>
              <th>Role</th>
              <th className="text-center">Risk</th>
              <th className="text-center">Trust</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {topIdentities.map((item) => (
              <tr
                key={item.user_id}
                onClick={() => navigate(`/investigation/${item.user_id}`)}
                className="cursor-pointer"
              >
                <td className="py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-sm bg-[var(--snt-cream-200)] border border-[var(--snt-cream-300)] flex items-center justify-center font-bold text-[var(--snt-cream-text)] text-[10px] font-mono shrink-0">
                      {item.user_id.substring(0, 4)}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--snt-cream-text)] font-mono text-[11px]">
                        {item.user_id}
                      </div>
                      <div className="text-[10px] text-[var(--snt-cream-muted)]">{item.name}</div>
                    </div>
                  </div>
                </td>

                <td className="py-2.5">
                  <div className="font-medium text-[var(--snt-cream-text)] text-xs">{item.role}</div>
                  <div className="text-[10px] text-[var(--snt-cream-muted)] uppercase tracking-wider">{item.department}</div>
                </td>

                <td className="py-2.5 text-center">
                  <span
                    className={clsx(
                      'font-mono font-bold px-1.5 py-0.5 rounded-sm text-[10px]',
                      item.risk_score >= 80
                        ? 'bg-[#ffebee] text-[#9b2c2c] border border-[#ffcdd2]'
                        : item.risk_score >= 60
                        ? 'bg-[#fff3e0] text-[#9c4a10] border border-[#ffe0b2]'
                        : 'bg-[#fff8e1] text-[#7a6512] border border-[#ffecb3]'
                    )}
                  >
                    {item.risk_score}
                  </span>
                </td>

                <td className="py-2.5 text-center">
                  <span className="font-mono text-[10px] text-[var(--snt-cream-muted)]">{item.trust_score} / 100</span>
                </td>

                <td className="py-2.5">
                  <Badge variant="risk" riskLevel={item.status === 'CRITICAL' ? 'CRITICAL' : item.status === 'UNDER_INVESTIGATION' ? 'HIGH' : 'MEDIUM'}>
                    {item.status}
                  </Badge>
                </td>

                <td className="py-2.5 text-right">
                  <span className="inline-block px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-[var(--snt-cream-200)] text-[var(--snt-cream-text)] border border-[var(--snt-cream-300)] rounded-sm group-hover:bg-[var(--snt-cream-text)] group-hover:text-[var(--snt-cream-50)] transition-colors">
                    Investigate
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
