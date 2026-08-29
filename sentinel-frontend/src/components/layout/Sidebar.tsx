import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
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
  Radio
} from 'lucide-react';

import { clsx } from 'clsx';
import { IS_MOCK_MODE } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    <>
      <aside className="w-64 bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-slate-900 border-r border-[#1f293d] dark:border-[#1f293d] light:border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 select-none transition-colors">
        {/* Clickable Brand Header (Navigates to Home) */}
        <Link
          to="/"
          className="p-5 border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-800 flex items-center gap-3 hover:bg-[#111827]/40 dark:hover:bg-[#111827]/40 light:hover:bg-slate-800/60 transition-colors group cursor-pointer"
          title="Go to SENTINEL Command Center"
        >
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 group-hover:border-cyan-400 transition-colors">
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
        </Link>

        {/* Quick Search Shortcut */}
        <div className="px-4 py-3 border-b border-[#1f293d]/50 dark:border-[#1f293d]/50 light:border-slate-800">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-[#111827] dark:bg-[#111827] light:bg-slate-800 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-700 text-gray-400 dark:text-gray-400 light:text-slate-300 rounded-lg hover:border-cyan-500/40 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              Investigate an alert...
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-[#1f293d] dark:bg-[#1f293d] light:bg-slate-700 text-gray-300 rounded font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold text-gray-500 dark:text-gray-500 light:text-slate-400 tracking-widest uppercase mb-1.5">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={clsx(
                        'flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all',
                        isActive
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow-sm font-semibold'
                          : 'text-gray-400 dark:text-gray-400 light:text-slate-300 hover:text-gray-100 dark:hover:text-white light:hover:text-white hover:bg-[#111827] dark:hover:bg-[#111827] light:hover:bg-slate-800/80 border border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={clsx('w-4 h-4', isActive ? 'text-cyan-400' : 'text-gray-500 dark:text-gray-500 light:text-slate-400')} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#1f293d] text-gray-300 rounded font-mono uppercase">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Active Session Footer Card */}
        <div className="p-3 border-t border-[#1f293d] dark:border-[#1f293d] light:border-slate-800 bg-[#080b11] dark:bg-[#080b11] light:bg-slate-950">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-live" />
              <span className="font-mono text-gray-400 dark:text-gray-400 light:text-slate-400 text-[11px]">SOC SESSION</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">ACTIVE</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-400 light:text-slate-400 font-mono">
            <span>Role: <strong className="text-gray-200 dark:text-gray-200 light:text-white uppercase">{user?.role || 'Guest'}</strong></span>
            <span>{IS_MOCK_MODE ? 'Mock' : 'Live ML'}</span>
          </div>
        </div>
      </aside>

      {/* Global Omnisearch Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
