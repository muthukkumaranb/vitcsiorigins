import React from 'react';
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
      textColor: 'text-[var(--snt-critical-text)]',
      bgColor: 'bg-[var(--snt-navy-750)]',
      borderColor: 'border-[var(--snt-navy-500)] hover:border-[var(--snt-critical-border)]',
      accentStrip: 'bg-[var(--snt-critical-text)]'
    },
    {
      level: 'HIGH',
      count: counts.high,
      icon: AlertTriangle,
      textColor: 'text-[var(--snt-high-text)]',
      bgColor: 'bg-[var(--snt-navy-750)]',
      borderColor: 'border-[var(--snt-navy-500)] hover:border-[var(--snt-high-border)]',
      accentStrip: 'bg-[var(--snt-high-text)]'
    },
    {
      level: 'MEDIUM',
      count: counts.medium,
      icon: Info,
      textColor: 'text-[var(--snt-medium-text)]',
      bgColor: 'bg-[var(--snt-navy-750)]',
      borderColor: 'border-[var(--snt-navy-500)] hover:border-[var(--snt-medium-border)]',
      accentStrip: 'bg-[var(--snt-medium-text)]'
    },
    {
      level: 'LOW',
      count: counts.low,
      icon: ShieldCheck,
      textColor: 'text-[var(--snt-safe-text)]',
      bgColor: 'bg-[var(--snt-navy-750)]',
      borderColor: 'border-[var(--snt-navy-500)] hover:border-[var(--snt-safe-border)]',
      accentStrip: 'bg-[var(--snt-safe-text)]'
    }
  ];

  return (
    <div className="snt-panel col-span-full lg:col-span-4 p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--snt-navy-500)]">
        <h2 className="snt-heading text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[var(--snt-critical-text)]" />
          Threat Breakdown
        </h2>
        <span className="snt-label">By Severity</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {severityItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.level}
              onClick={() => navigate(`/threats?severity=${item.level}`)}
              className={clsx(
                'relative p-4 rounded-sm border transition-all text-left cursor-pointer flex flex-col justify-between group overflow-hidden',
                item.bgColor,
                item.borderColor
              )}
            >
              {/* Left accent strip instead of full color block */}
              <div className={clsx('absolute left-0 top-0 bottom-0 w-1 opacity-60 group-hover:opacity-100 transition-opacity', item.accentStrip)} />

              <div className="flex items-center justify-between mb-2 pl-1">
                <span className={clsx('snt-label', item.textColor)}>
                  {item.level}
                </span>
                <Icon className={clsx('w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity', item.textColor)} />
              </div>
              <div className="text-xl font-bold font-['IBM_Plex_Mono',monospace] text-[var(--snt-text-primary)] pl-1">
                {item.count}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
