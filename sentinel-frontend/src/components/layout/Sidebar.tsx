import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  Activity,
  BarChart3,
  FileCheck,
  Settings,
  Shield,
  Search,
  Radio,
  UserCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { IS_MOCK_MODE } from '../../services';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navSections = [
    {
      title: 'COMMAND CENTER',
      items: [
        { label: 'Security Posture', path: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'DETECTION',
      items: [
        { label: 'Threat Center', path: '/threats', icon: ShieldAlert, badge: IS_MOCK_MODE ? 'DEMO' : undefined },
        { label: 'Privileged Identities', path: '/identities', icon: Users },
        { label: 'Runtime Behaviour', path: '/runtime-behaviour', icon: Radio }
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { label: 'Behaviour & Risk', path: '/behaviour', icon: Activity },
        { label: 'Security Analytics', path: '/analytics', icon: BarChart3 }
      ]
    },
    {
      title: 'RESPONSE',
      items: [
        { label: 'Response & Audit', path: '/audit', icon: FileCheck }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Settings & RBAC', path: '/settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-900 border-r border-[#1f293d] dark:border-[#1f293d] light:border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 select-none transition-colors">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-800 flex items-center gap-3">
        <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wider text-gray-100 dark:text-gray-100 light:text-white flex items-center gap-1.5 font-mono">
            SENTINEL
            <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded font-semibold">
              v2.5
            </span>
          </h1>
          <p className="text-[11px] text-gray-400 dark:text-gray-400 light:text-slate-400 font-medium tracking-tight">
            Continuous Privileged Trust
          </p>
        </div>
      </div>

      {/* Quick Search Shortcut */}
      <div className="px-4 py-3 border-b border-[#1f293d]/50 dark:border-[#1f293d]/50 light:border-slate-800">
        <NavLink
          to="/threats"
          className="flex items-center justify-between px-3 py-1.5 text-xs bg-[#111827] dark:bg-[#111827] light:bg-slate-800 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-700 text-gray-400 dark:text-gray-400 light:text-slate-300 rounded-lg hover:border-cyan-500/40 hover:text-gray-200 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            Investigate an alert...
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-[#1f293d] dark:bg-[#1f293d] light:bg-slate-700 text-gray-300 rounded font-mono">
            ⌘K
          </kbd>
        </NavLink>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-gray-500 dark:text-gray-500 light:text-slate-400 tracking-widest uppercase mb-1.5">
              {section.title}
            </h3>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path === '/threats' && location.pathname.startsWith('/threats')) ||
                (item.path === '/analytics' && (location.pathname === '/security-analysis' || location.pathname === '/analytics')) ||
                (item.path === '/behaviour' && (location.pathname === '/behaviour' || location.pathname === '/behaviour-risk')) ||
                (item.path.startsWith('/investigation') && location.pathname.startsWith('/investigation'));

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={clsx(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-cyan-950/60 dark:bg-cyan-950/60 light:bg-cyan-900/40 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                      : 'text-gray-400 dark:text-gray-400 light:text-slate-300 hover:text-gray-200 dark:hover:text-gray-200 light:hover:text-white hover:bg-[#111827] dark:hover:bg-[#111827] light:hover:bg-slate-800 hover:border hover:border-[#1f293d]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={clsx(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={clsx(
                        'px-1.5 py-0.5 rounded text-[10px] font-semibold border',
                        item.badge.includes('CRITICAL')
                          ? 'bg-red-950/60 text-red-400 border-red-800'
                          : 'bg-cyan-950/60 text-cyan-400 border-cyan-800'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* User RBAC Status & Footer info */}
      <div className="p-3 border-t border-[#1f293d] dark:border-[#1f293d] light:border-slate-800 bg-[#080b11] dark:bg-[#080b11] light:bg-slate-950 space-y-2">
        <div className="flex items-center justify-between px-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-400 light:text-slate-400">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[110px]">{user?.name || 'User'}</span>
          </div>
          <span className="px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded font-mono text-[9px] font-bold uppercase">
            {user?.role || 'VIEWER'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-500 light:text-slate-500 px-1">
          <span>Problem Statement 9</span>
          <span className="text-cyan-400 font-semibold">CSI ORIGIN 2026</span>
        </div>
      </div>
    </aside>
  );
};
