import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';
import { Threat } from '../../types/security';
import { ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { formatTimestamp, formatSeverity } from '../../utils/formatters';

interface ThreatCardProps {
  threat: Threat;
}

export const ThreatCard: React.FC<ThreatCardProps> = ({ threat }) => {
  const navigate = useNavigate();

  const isCritical = threat.risk_level === 'CRITICAL';

  return (
    <Card
      hoverable
      className={clsx(
        'relative flex flex-col justify-between transition-all duration-200',
        isCritical && 'border-red-500/50 bg-red-950/10 glow-critical'
      )}
    >
      <div>
        {/* Top Bar Header */}
        <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-[#1f293d]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-gray-100 font-mono">{threat.user_id}</span>
              <Badge variant="account" accountType={threat.account_type || 'Employee'}>
                {threat.account_type || 'Employee'}
              </Badge>
            </div>
            {threat.role && (
              <p className="text-xs text-gray-300 font-medium mt-0.5">{threat.role}</p>
            )}
            {threat.user_name && threat.user_name !== threat.user_id && (
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{threat.user_name}</p>
            )}
          </div>

          <div className="text-right shrink-0">
            <div className="flex items-center justify-end gap-1.5 mb-1">
              <Badge variant="risk" riskLevel={threat.risk_level}>
                {formatSeverity(threat.risk_level)}
              </Badge>
            </div>
            <div className="text-xl font-black font-mono text-gray-100">
              <span className={isCritical ? 'text-red-400' : 'text-orange-400'}>
                {threat.risk_score}
              </span>
              <span className="text-xs text-gray-400 font-normal"> / 100</span>
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400 mb-3">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span>Detected: {formatTimestamp(threat.timestamp, 'full')}</span>
        </div>

        {/* Primary Reasons */}
        <div className="mb-4 space-y-1.5">
          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Primary Threat Indicators ({threat.primary_reasons.length})
          </h4>
          <ul className="space-y-1">
            {threat.primary_reasons.length ? (
              threat.primary_reasons.map((reason, idx) => (
                <li
                  key={idx}
                  className="text-xs text-gray-300 flex items-start gap-2 bg-[#0b0f17]/50 px-2.5 py-1 rounded border border-[#1f293d]/60"
                >
                  <span className="text-cyan-400 font-mono text-[10px] mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-gray-400">Baseline deviation detected</li>
            )}
          </ul>
        </div>
      </div>


      {/* Footer Recommendation & Action */}
      <div className="pt-3 border-t border-[#1f293d] mt-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Recommended</div>
          <div
            className={clsx(
              'text-xs font-black tracking-wide font-mono mt-0.5',
              isCritical ? 'text-red-400' : 'text-orange-400'
            )}
          >
            {threat.recommended_action || 'Review'}
          </div>
        </div>

        <Button
          variant={isCritical ? 'danger' : 'primary'}
          size="sm"
          icon={<ArrowRight className="w-3.5 h-3.5" />}
          onClick={() => navigate(`/investigation/${threat.event_id || threat.user_id}`)}
        >
          INVESTIGATE
        </Button>
      </div>
    </Card>
  );
};
