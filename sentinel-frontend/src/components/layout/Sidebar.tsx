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
        { label: 'Threat Center', path: '/threats', icon: ShieldAlert, badge: '3 CRITICAL' },
        { label: 'Privileged Identities', path: '/identities', icon: Users }
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { label: 'Behaviour & Risk', path: '/investigation/U0345', icon: Activity, badge: 'U0345' },
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
    <aside
      className="w-64 border-r flex flex-col h-screen sticky top-0 shrink-0 select-none"
      style={{
        backgroundColor: 'var(--snt-navy-800)',
        borderColor: 'var(--snt-navy-500)'
      }}
    >
      {/* Brand Header */}
      <div className="p-5 border-b flex items-center gap-3" style={{ borderColor: 'var(--snt-navy-500)' }}>
        <div className="p-2 border rounded-sm" style={{ backgroundColor: 'var(--snt-navy-700)', borderColor: 'var(--snt-navy-400)', color: 'var(--snt-text-primary)' }}>
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg tracking-wide flex items-center gap-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'var(--snt-text-primary)' }}>
            SENTINEL
            <span
              className="text-[9px] px-1.5 py-0.5 border rounded-sm tracking-wider uppercase font-mono"
              style={{
                backgroundColor: 'var(--snt-navy-700)',
                color: 'var(--snt-text-secondary)',
                borderColor: 'var(--snt-navy-500)'
              }}
            >
              v2.4
            </span>
          </h1>
          <p className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: 'var(--snt-text-tertiary)', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Continuous Trust
          </p>
        </div>
      </div>

      {/* Quick Search Shortcut */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(37, 52, 80, 0.5)' }}>
        <NavLink
          to="/investigation/U0345"
          className="flex items-center justify-between px-3 py-1.5 text-xs border rounded-sm transition-colors group"
          style={{
            backgroundColor: 'var(--snt-navy-900)',
            borderColor: 'var(--snt-navy-500)',
            color: 'var(--snt-text-secondary)'
          }}
        >
          <span className="flex items-center gap-2 group-hover:text-[var(--snt-text-primary)] transition-colors">
            <Search className="w-3.5 h-3.5 text-[var(--snt-text-tertiary)] group-hover:text-[var(--snt-text-secondary)] transition-colors" />
            Investigate U0345...
          </span>
          <kbd
            className="px-1.5 py-0.5 text-[10px] border rounded-sm font-mono"
            style={{
              backgroundColor: 'var(--snt-navy-750)',
              borderColor: 'var(--snt-navy-400)',
              color: 'var(--snt-text-mono)'
            }}
          >
            ⌘K
          </kbd>
        </NavLink>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: 'var(--snt-text-tertiary)', fontFamily: "'IBM Plex Sans', sans-serif" }}>
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
                    'snt-nav-item',
                    isActive ? 'snt-nav-item-active' : ''
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={clsx(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-[var(--snt-accent-light)]' : 'text-[var(--snt-navy-200)] group-hover:text-[var(--snt-text-secondary)]'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold tracking-wider border font-mono uppercase"
                      style={
                        item.badge.includes('CRITICAL')
                          ? {
                              backgroundColor: 'var(--snt-critical-bg)',
                              color: 'var(--snt-critical-text)',
                              borderColor: 'var(--snt-critical-border)'
                            }
                          : {
                              backgroundColor: 'var(--snt-navy-700)',
                              color: 'var(--snt-text-mono)',
                              borderColor: 'var(--snt-navy-500)'
                            }
                      }
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
      <div className="p-4 border-t" style={{ borderColor: 'var(--snt-navy-500)', backgroundColor: 'var(--snt-navy-950)' }}>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--snt-text-tertiary)' }}>
          <span>Prob. Stmt. 9</span>
          <span style={{ color: 'var(--snt-text-secondary)' }}>CSI ORIGIN 2026</span>
        </div>
      </div>
    </aside>
  );
};
