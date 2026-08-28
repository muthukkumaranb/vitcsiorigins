import React from 'react';
import { Card } from '../common/Card';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

interface ThreatOverviewProps {
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export const ThreatOverview: React.FC<ThreatOverviewProps> = ({ counts }) => {
  const navigate = useNavigate();

  const severityItems = [
    {
      level: 'CRITICAL',
      count: counts.critical,
      icon: ShieldAlert,
      textColor: 'text-red-500',
      bgColor: 'bg-red-950/40',
      borderColor: 'border-red-500/40 hover:border-red-500',
      glow: 'glow-critical'
    },
    {
      level: 'HIGH',
      count: counts.high,
      icon: AlertTriangle,
      textColor: 'text-orange-500',
      bgColor: 'bg-orange-950/40',
      borderColor: 'border-orange-500/40 hover:border-orange-500',
      glow: 'glow-high'
    },
    {
      level: 'MEDIUM',
      count: counts.medium,
      icon: Info,
      textColor: 'text-yellow-500',
      bgColor: 'bg-yellow-950/40',
      borderColor: 'border-yellow-500/40 hover:border-yellow-500',
      glow: ''
    },
    {
      level: 'LOW',
      count: counts.low,
      icon: ShieldCheck,
      textColor: 'text-emerald-500',
      bgColor: 'bg-emerald-950/40',
      borderColor: 'border-emerald-500/40 hover:border-emerald-500',
      glow: ''
    }
  ];

  return (
    <Card className="col-span-full lg:col-span-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          Threat Breakdown
        </h2>
        <span className="text-xs text-gray-400">By Severity</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {severityItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.level}
              onClick={() => navigate(`/threats?severity=${item.level}`)}
              className={clsx(
                'p-4 rounded-xl border transition-all text-left cursor-pointer flex flex-col justify-between group',
                item.bgColor,
                item.borderColor,
                item.glow
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={clsx('text-xs font-extrabold tracking-wider', item.textColor)}>
                  {item.level}
                </span>
                <Icon className={clsx('w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity', item.textColor)} />
              </div>
              <div className="text-2xl font-black font-mono text-gray-100">{item.count}</div>
              <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 group-hover:text-gray-200 transition-colors">
                <span>View Threats</span>
                <span>→</span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
