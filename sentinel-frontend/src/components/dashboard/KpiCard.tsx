import React from 'react';
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
  trendLabel = 'vs prev 24h',
  icon,
  accentColor = 'cyan'
}) => {
  // Map accent to new muted palette tokens
  const colorMap = {
    cyan: { text: 'text-[var(--snt-accent-light)]', bg: 'bg-[var(--snt-accent-dim)]', border: 'border-[var(--snt-accent)]' },
    red: { text: 'text-[var(--snt-critical-text)]', bg: 'bg-[var(--snt-critical-bg)]', border: 'border-[var(--snt-critical-border)]' },
    amber: { text: 'text-[var(--snt-high-text)]', bg: 'bg-[var(--snt-high-bg)]', border: 'border-[var(--snt-high-border)]' },
    emerald: { text: 'text-[var(--snt-safe-text)]', bg: 'bg-[var(--snt-safe-bg)]', border: 'border-[var(--snt-safe-border)]' }
  };

  const style = colorMap[accentColor];
  const isPositive = trend && trend > 0;

  return (
    <div className="snt-panel flex flex-col justify-between p-4 relative overflow-hidden group">
      {/* Top accent strip instead of full left border */}
      <div className={clsx('absolute top-0 left-0 right-0 h-0.5 opacity-50', style.bg)} />

      <div className="flex items-start justify-between">
        <div>
          <h3 className="snt-label">{title}</h3>
          <div className="text-2xl font-semibold tracking-tight text-[var(--snt-text-primary)] mt-1.5 font-['IBM_Plex_Mono',monospace]">
            {value}
          </div>
          {subtitle && <p className="text-[10px] text-[var(--snt-text-tertiary)] mt-0.5">{subtitle}</p>}
        </div>
        {icon && (
          <div className={clsx('p-1.5 rounded-sm border opacity-70 group-hover:opacity-100 transition-opacity', style.bg, style.border, style.text)}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' })}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-4 pt-3 border-t border-[var(--snt-navy-500)] flex items-center gap-2 text-[10px]">
          <span
            className={clsx(
              'inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-sm font-mono',
              isPositive
                ? 'bg-[var(--snt-safe-bg)] text-[var(--snt-safe-text)] border border-[var(--snt-safe-border)]'
                : 'bg-[var(--snt-critical-bg)] text-[var(--snt-critical-text)] border border-[var(--snt-critical-border)]'
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? `+${trend}%` : `${trend}%`}
          </span>
          <span className="text-[var(--snt-text-tertiary)] uppercase tracking-wider">{trendLabel}</span>
        </div>
      )}
    </div>
  );
};
