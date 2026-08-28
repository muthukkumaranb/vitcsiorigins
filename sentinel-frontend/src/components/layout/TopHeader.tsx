import React from 'react';
import { Bell, RefreshCcw, ShieldCheck, User } from 'lucide-react';
import { IS_MOCK_MODE } from '../../services';

interface TopHeaderProps {
  lastUpdated?: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ lastUpdated = 12 }) => {
  return (
    <header
      className="h-14 border-b px-6 flex items-center justify-between sticky top-0 z-30"
      style={{
        backgroundColor: 'var(--snt-navy-800)',
        borderColor: 'var(--snt-navy-500)'
      }}
    >
      {/* Left Engine Status Indicators */}
      <div className="flex items-center gap-4 text-xs font-['IBM_Plex_Sans',sans-serif]">
        <div
          className="flex items-center gap-2 px-2.5 py-1 border rounded-sm font-semibold uppercase tracking-wider text-[10px]"
          style={{
            backgroundColor: 'var(--snt-safe-bg)',
            borderColor: 'var(--snt-safe-border)',
            color: 'var(--snt-safe-text)'
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--snt-safe-text)] animate-pulse-live" />
          <span>Detection Engine Online</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: 'var(--snt-text-tertiary)' }}>
          <RefreshCcw className="w-3 h-3 animate-spin-slow" style={{ opacity: 0.6 }} />
          <span>Last updated: {lastUpdated}s ago</span>
        </div>

        {IS_MOCK_MODE && (
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 border rounded-sm text-[10px] font-bold tracking-wider uppercase ml-2"
            style={{
              backgroundColor: 'var(--snt-medium-bg)',
              borderColor: 'var(--snt-medium-border)',
              color: 'var(--snt-medium-text)'
            }}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>DEMO (Local Data)</span>
          </div>
        )}
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          className="relative p-1.5 rounded-sm transition-colors border border-transparent"
          style={{ color: 'var(--snt-text-secondary)' }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--snt-navy-700)';
            e.currentTarget.style.borderColor = 'var(--snt-navy-400)';
            e.currentTarget.style.color = 'var(--snt-text-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.color = 'var(--snt-text-secondary)';
          }}
          title="Active Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--snt-critical-text)' }} />
        </button>

        <div className="h-4 w-[1px]" style={{ backgroundColor: 'var(--snt-navy-500)' }} />

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-sm border flex items-center justify-center text-xs"
            style={{
              backgroundColor: 'var(--snt-navy-700)',
              borderColor: 'var(--snt-navy-400)',
              color: 'var(--snt-text-primary)'
            }}
          >
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-[11px] font-bold leading-tight uppercase tracking-wide" style={{ color: 'var(--snt-text-primary)' }}>SOC Lead Analyst</div>
            <div className="text-[10px] font-mono" style={{ color: 'var(--snt-text-tertiary)' }}>ID: SOC-ADMIN-01</div>
          </div>
        </div>
      </div>
    </header>
  );
};
