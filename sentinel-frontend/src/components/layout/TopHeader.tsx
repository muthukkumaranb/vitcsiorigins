import React from 'react';
import { Bell, RefreshCcw, ShieldCheck, User, Sun, Moon, LogOut } from 'lucide-react';
import { IS_MOCK_MODE } from '../../services';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface TopHeaderProps {
  lastUpdated?: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ lastUpdated = 12 }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin':
        return <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded text-[9px] font-bold uppercase">ADMIN</span>;
      case 'security_analyst':
        return <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[9px] font-bold uppercase">ANALYST</span>;
      case 'viewer':
        return <span className="px-1.5 py-0.5 bg-gray-800 text-gray-300 border border-gray-700 rounded text-[9px] font-bold uppercase">VIEWER</span>;
      default:
        return null;
    }
  };

  return (
    <header className="h-16 bg-[#0b0f17]/90 dark:bg-[#0b0f17]/90 light:bg-white/90 backdrop-blur-md border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left Engine Status Indicators */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/40 dark:bg-emerald-950/40 light:bg-emerald-50 border border-emerald-500/30 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 rounded-full font-medium shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-live" />
          <span>Detection Engine Online</span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-400 light:text-slate-500 font-mono">
          <RefreshCcw className="w-3.5 h-3.5 text-gray-500 dark:text-gray-500 light:text-slate-400 animate-spin-slow" />
          <span>Last updated: {lastUpdated}s ago</span>
        </div>

        {IS_MOCK_MODE && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-950/50 dark:bg-amber-950/50 light:bg-amber-50 border border-amber-500/40 text-amber-400 dark:text-amber-400 light:text-amber-800 rounded text-[11px] font-semibold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DEMO MODE</span>
          </div>
        )}
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-3">
        {/* Light / Dark Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-400 dark:text-gray-400 light:text-slate-600 hover:text-gray-200 dark:hover:text-gray-200 light:hover:text-slate-900 bg-[#111827] dark:bg-[#111827] light:bg-slate-100 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Notification Bell */}
        <button
          className="relative p-2 text-gray-400 dark:text-gray-400 light:text-slate-600 hover:text-gray-200 dark:hover:text-gray-200 light:hover:text-slate-900 bg-[#111827] dark:bg-[#111827] light:bg-slate-100 rounded-lg transition-colors border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300"
          title="Active Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="h-4 w-[1px] bg-[#1f293d] dark:bg-[#1f293d] light:bg-slate-200" />

        {/* User Info & RBAC Role */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-950 dark:bg-cyan-950 light:bg-cyan-100 border border-cyan-500/40 flex items-center justify-center text-cyan-300 dark:text-cyan-300 light:text-cyan-700 font-bold text-xs">
            <User className="w-4 h-4 text-cyan-400 dark:text-cyan-400 light:text-cyan-600" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-gray-200 dark:text-gray-200 light:text-slate-900 leading-tight flex items-center gap-1.5">
              {user?.name || 'Security User'}
              {getRoleBadge()}
            </div>
            <div className="text-[10px] text-gray-400 dark:text-gray-400 light:text-slate-500 font-mono">
              {user?.email || 'user@sentinel.sec'}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-1.5 text-gray-400 dark:text-gray-400 light:text-slate-500 hover:text-red-400 dark:hover:text-red-400 light:hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
            title="Log Out of Demo Session"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
