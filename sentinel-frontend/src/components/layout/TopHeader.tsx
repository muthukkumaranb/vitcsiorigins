import React from 'react';
import { Bell, RefreshCcw, ShieldCheck, User } from 'lucide-react';
import { IS_MOCK_MODE } from '../../services';

interface TopHeaderProps {
  lastUpdated?: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ lastUpdated = 12 }) => {
  return (
    <header className="h-16 bg-[#0b0f17]/90 backdrop-blur-md border-b border-[#1f293d] px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left Engine Status Indicators */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-full font-medium shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-live" />
          <span>Detection Engine Online</span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-400 font-mono">
          <RefreshCcw className="w-3.5 h-3.5 text-gray-500 animate-spin-slow" />
          <span>Last updated: {lastUpdated}s ago</span>
        </div>

        {IS_MOCK_MODE && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-950/50 border border-amber-500/40 text-amber-400 rounded text-[11px] font-semibold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DEMO MODE (Local Telemetry)</span>
          </div>
        )}
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          className="relative p-2 text-gray-400 hover:text-gray-200 hover:bg-[#111827] rounded-lg transition-colors border border-transparent hover:border-[#1f293d]"
          title="Active Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="h-4 w-[1px] bg-[#1f293d]" />

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
            <User className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-gray-200 leading-tight">SOC Lead Analyst</div>
            <div className="text-[10px] text-gray-400 font-mono">ID: SOC-ADMIN-01</div>
          </div>
        </div>
      </div>
    </header>
  );
};
