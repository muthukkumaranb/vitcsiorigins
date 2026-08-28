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
  Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { IS_MOCK_MODE } from '../../services';

export const Sidebar: React.FC = () => {
  const location = useLocation();

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
        { label: 'Privileged Identities', path: '/identities', icon: Users }
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { label: 'Behaviour & Risk', path: '/threats', icon: Activity },
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
        { label: 'Settings', path: '/settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#0b0f17] border-r border-[#1f293d] flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1f293d] flex items-center gap-3">
        <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wider text-gray-100 flex items-center gap-1.5">
            SENTINEL
            <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded font-semibold">
              v2.4
            </span>
          </h1>
          <p className="text-[11px] text-gray-400 font-medium tracking-tight">
            Continuous Privileged Trust
          </p>
        </div>
      </div>

      {/* Quick Search Shortcut */}
      <div className="px-4 py-3 border-b border-[#1f293d]/50">
        <NavLink
          to="/threats"
          className="flex items-center justify-between px-3 py-1.5 text-xs bg-[#111827] border border-[#1f293d] text-gray-400 rounded-lg hover:border-cyan-500/40 hover:text-gray-200 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            Investigate an alert...
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-[#1f293d] text-gray-300 rounded font-mono">
            ⌘K
          </kbd>
        </NavLink>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1.5">
              {section.title}
            </h3>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path.startsWith('/investigation') && location.pathname.startsWith('/investigation'));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#111827] hover:border hover:border-[#1f293d]'
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

      {/* Footer info */}
      <div className="p-4 border-t border-[#1f293d] bg-[#080b11]">
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>Problem Statement 9</span>
          <span className="text-cyan-400 font-semibold">CSI ORIGIN 2026</span>
        </div>
      </div>
    </aside>
  );
};
