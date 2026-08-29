import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  RefreshCcw,
  ShieldCheck,
  User,
  Sun,
  Moon,
  LogOut,
  Search,
  Shield,
  X,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { IS_MOCK_MODE } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

interface TopHeaderProps {
  lastUpdated?: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ lastUpdated = 12 }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, removeNotification, clearAll, markAllAsRead } = useNotifications();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut Ctrl+K / Cmd+K for Omnisearch
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

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
    <>
      <header className="h-16 bg-[#0b0f17]/90 dark:bg-[#0b0f17]/90 light:bg-white/90 backdrop-blur-md border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
        {/* Left Engine Status Indicators & Clickable Brand Home */}
        <div className="flex items-center gap-4 text-xs">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity font-mono font-bold text-gray-100 dark:text-gray-100 light:text-slate-900 group"
            title="SENTINEL Command Center (Home)"
          >
            <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400 group-hover:border-cyan-400 transition-colors">
              <Shield className="w-4 h-4" />
            </div>
            <span className="tracking-wider">SENTINEL</span>
          </Link>

          <div className="h-4 w-[1px] bg-[#1f293d] dark:bg-[#1f293d] light:bg-slate-200 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-950/40 dark:bg-emerald-950/40 light:bg-emerald-50 border border-emerald-500/30 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 rounded-full font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-live" />
            <span>Detection Engine Online</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-gray-400 dark:text-gray-400 light:text-slate-500 font-mono">
            <RefreshCcw className="w-3.5 h-3.5 text-gray-500 dark:text-gray-500 light:text-slate-400 animate-spin-slow" />
            <span>Last updated: {lastUpdated}s ago</span>
          </div>

          {IS_MOCK_MODE && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-950/50 dark:bg-amber-950/50 light:bg-amber-50 border border-amber-500/40 text-amber-400 dark:text-amber-400 light:text-amber-800 rounded text-[11px] font-semibold tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DEMO MODE</span>
            </div>
          )}
        </div>

        {/* Center/Right Global Search & Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Global Search Omnibar Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#111827] dark:bg-[#111827] light:bg-slate-100 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 text-gray-400 hover:text-gray-200 dark:hover:text-gray-200 light:hover:text-slate-900 rounded-lg hover:border-cyan-500/40 transition-colors shadow-sm cursor-pointer"
            title="Global Search (Ctrl+K)"
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Search events, users, threats...</span>
            <kbd className="px-1.5 py-0.2 text-[10px] bg-[#1f293d] dark:bg-[#1f293d] light:bg-slate-200 text-gray-400 rounded font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Light / Dark Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-400 dark:text-gray-400 light:text-slate-600 hover:text-gray-200 dark:hover:text-gray-200 light:hover:text-slate-900 bg-[#111827] dark:bg-[#111827] light:bg-slate-100 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 rounded-lg transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Notification Bell with Dropdown Drawer */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setIsNotifOpen((prev) => !prev);
                markAllAsRead();
              }}
              className="relative p-2 text-gray-400 dark:text-gray-400 light:text-slate-600 hover:text-gray-200 dark:hover:text-gray-200 light:hover:text-slate-900 bg-[#111827] dark:bg-[#111827] light:bg-slate-100 rounded-lg transition-colors border border-[#1f293d] dark:border-[#1f293d] light:border-slate-300 cursor-pointer"
              title="Active Alerts & Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </>
              )}
            </button>

            {/* Notification Popover Drawer */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-white border border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                <div className="p-3 border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 flex items-center justify-between bg-[#111827] dark:bg-[#111827] light:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-gray-200 dark:text-gray-200 light:text-slate-900 uppercase font-mono">
                      SOC Notifications ({notifications.length})
                    </span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-[11px] text-gray-400 hover:text-red-400 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#1f293d]/60 dark:divide-[#1f293d]/60 light:divide-slate-100">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs space-y-1 transition-colors ${
                          n.type === 'critical'
                            ? 'bg-red-950/20 hover:bg-red-950/30'
                            : 'hover:bg-[#111827]/60 dark:hover:bg-[#111827]/60 light:hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {n.type === 'critical' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span className="font-bold text-gray-200 dark:text-gray-200 light:text-slate-900 font-mono text-[11px]">
                              {n.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <span className="text-[10px] font-mono">{n.timestamp}</span>
                            <button
                              onClick={() => removeNotification(n.id)}
                              className="text-gray-400 hover:text-gray-200 p-0.5"
                              title="Dismiss"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-400 dark:text-gray-400 light:text-slate-600 leading-relaxed">
                          {n.message}
                        </p>

                        {n.actionPath && (
                          <button
                            onClick={() => {
                              navigate(n.actionPath!);
                              setIsNotifOpen(false);
                            }}
                            className="text-[10px] text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono pt-1"
                          >
                            <span>Open Triage Workspace</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500 text-xs">
                      No active alerts or notifications.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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
              className="p-1.5 text-gray-400 dark:text-gray-400 light:text-slate-500 hover:text-red-400 dark:hover:text-red-400 light:hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30 cursor-pointer"
              title="Log Out of Demo Session"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Global Omnisearch Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
