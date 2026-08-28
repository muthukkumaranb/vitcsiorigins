import React from 'react';
import { Card } from '../common/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // e.g. 8.4 or -14.2
  trendLabel?: string;
  icon?: React.ReactNode;
  accentColor?: 'cyan' | 'red' | 'amber' | 'emerald';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel = 'vs previous 24h',
  icon,
  accentColor = 'cyan'
}) => {
  const accentBorderMap = {
    cyan: 'border-l-4 border-l-cyan-500',
    red: 'border-l-4 border-l-red-500',
    amber: 'border-l-4 border-l-amber-500',
    emerald: 'border-l-4 border-l-emerald-500'
  };

  const isPositive = trend && trend > 0;

  return (
    <Card className={clsx('relative overflow-hidden', accentBorderMap[accentColor])}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
          <div className="text-3xl font-extrabold tracking-tight text-gray-100 mt-2 font-mono">
            {value}
          </div>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className="p-2.5 bg-[#1f293d]/60 rounded-lg text-gray-300 border border-[#1f293d]">
            {icon}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-4 pt-3 border-t border-[#1f293d]/60 flex items-center gap-2 text-xs">
          <span
            className={clsx(
              'inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px]',
              isPositive
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                : 'bg-red-950/60 text-red-400 border border-red-800'
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {isPositive ? `+${trend}%` : `${trend}%`}
          </span>
          <span className="text-gray-400">{trendLabel}</span>
        </div>
      )}
    </Card>
  );
};
