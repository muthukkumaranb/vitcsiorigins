import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldAlert,
  Users,
  Activity,
  BarChart3,
  FileCheck,
  Settings,
  LayoutDashboard,
  Radio,
  ArrowRight,
  X,
  FileText
} from 'lucide-react';
import { useThreatsData, useIdentitiesData } from '../../hooks/useSecurityData';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Pages' | 'Threats' | 'Identities' | 'Events';
  path: string;
  badge?: string;
  icon: React.ReactNode;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: threats = [] } = useThreatsData();
  const { data: identities = [] } = useIdentitiesData();


  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const defaultPages: SearchResultItem[] = useMemo(
    () => [
      {
        id: 'page-dashboard',
        title: 'Command Center — Security Posture',
        subtitle: 'Main executive dashboard and telemetry status',
        category: 'Pages',
        path: '/dashboard',
        icon: <LayoutDashboard className="w-4 h-4 text-cyan-400" />
      },
      {
        id: 'page-threats',
        title: 'Detection — Threat Center',
        subtitle: 'Active privileged access anomalies and threat triage',
        category: 'Pages',
        path: '/threats',
        badge: `${threats.length} Active`,
        icon: <ShieldAlert className="w-4 h-4 text-red-400" />
      },
      {
        id: 'page-identities',
        title: 'Detection — Privileged Identities',
        subtitle: 'Enterprise access tracking and identity risk ranking',
        category: 'Pages',
        path: '/identities',
        icon: <Users className="w-4 h-4 text-blue-400" />
      },
      {
        id: 'page-runtime',
        title: 'Detection — Runtime Behaviour Centre',
        subtitle: 'Real-time telemetry stream and live attack simulator',
        category: 'Pages',
        path: '/runtime-behaviour',
        icon: <Radio className="w-4 h-4 text-emerald-400" />
      },
      {
        id: 'page-behaviour',
        title: 'Intelligence — Behaviour & Risk',
        subtitle: 'Baseline deviations, trust landscape, and risk intelligence',
        category: 'Pages',
        path: '/behaviour',
        icon: <Activity className="w-4 h-4 text-amber-400" />
      },
      {
        id: 'page-analytics',
        title: 'Intelligence — Security Analytics',
        subtitle: 'ML feature transparency and continuous model registry',
        category: 'Pages',
        path: '/analytics',
        icon: <BarChart3 className="w-4 h-4 text-indigo-400" />
      },
      {
        id: 'page-audit',
        title: 'Response — Response & Audit Logs',
        subtitle: 'Immutable forensic audit trail and response intervention',
        category: 'Pages',
        path: '/audit',
        icon: <FileCheck className="w-4 h-4 text-purple-400" />
      },
      {
        id: 'page-settings',
        title: 'System — Settings & RBAC Demo',
        subtitle: 'Access control switchers and theme configuration',
        category: 'Pages',
        path: '/settings',
        icon: <Settings className="w-4 h-4 text-gray-400" />
      }
    ],
    [threats.length]
  );

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return defaultPages;
    }

    const items: SearchResultItem[] = [];

    // Search Pages
    defaultPages.forEach((p) => {
      if (p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)) {
        items.push(p);
      }
    });

    // Search Threats
    threats.forEach((t) => {
      if (
        t.user_id.toLowerCase().includes(q) ||
        (t.user_name || '').toLowerCase().includes(q) ||
        (t.role || '').toLowerCase().includes(q) ||
        t.primary_reasons.some((r) => r.toLowerCase().includes(q))
      ) {
        items.push({
          id: `threat-${t.threat_id}`,
          title: `Threat: ${t.user_name || t.user_id} (${t.role})`,
          subtitle: t.primary_reasons.join(' · ') || `Risk Score: ${t.risk_score}`,
          category: 'Threats',
          path: `/investigation/${t.user_id}`,
          badge: t.risk_level,
          icon: <ShieldAlert className="w-4 h-4 text-red-400" />
        });
      }
    });

    // Search Identities
    identities.forEach((id) => {
      const name = id.name || id.user_id;
      const dept = id.department || 'Security & Operations';
      const role = id.role || 'Privileged Account';
      if (
        id.user_id.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        role.toLowerCase().includes(q) ||
        dept.toLowerCase().includes(q)
      ) {
        const score = id.risk_score ?? 0;
        const riskBadge = score >= 70 ? 'CRITICAL' : score >= 40 ? 'HIGH' : 'LOW';
        items.push({
          id: `identity-${id.user_id}`,
          title: `Identity: ${name} (${id.user_id})`,
          subtitle: `${role} · ${dept} · Risk: ${score}`,
          category: 'Identities',
          path: `/investigation/${id.user_id}`,
          badge: riskBadge,
          icon: <Users className="w-4 h-4 text-blue-400" />
        });

      }
    });


    // Known benchmark/event search shortcuts
    const benchmarkEvents = [
      { id: 'E0408', user: 'U003', desc: 'Sensitive export without ticket', risk: 'HIGH (55.0)' },
      { id: 'E0412', user: 'U003', desc: 'Routine system heartbeat baseline', risk: 'LOW (6.67)' },
      { id: 'E0402', user: 'U002', desc: 'Privileged table access baseline', risk: 'LOW (22.67)' },
      { id: 'E0407', user: 'U003', desc: 'Suspicious elevated privilege command', risk: 'CRITICAL (85.0)' }
    ];

    benchmarkEvents.forEach((evt) => {
      if (
        evt.id.toLowerCase().includes(q) ||
        evt.user.toLowerCase().includes(q) ||
        evt.desc.toLowerCase().includes(q)
      ) {
        items.push({
          id: `event-${evt.id}`,
          title: `Security Event: ${evt.id} (${evt.user})`,
          subtitle: `${evt.desc} · Score: ${evt.risk}`,
          category: 'Events',
          path: `/investigation/${evt.id}`,
          badge: 'EVENT',
          icon: <FileText className="w-4 h-4 text-cyan-400" />
        });
      }
    });

    return items;
  }, [query, defaultPages, threats, identities]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelect = (item: SearchResultItem) => {
    navigate(item.path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#0b0f17] dark:bg-[#0b0f17] light:bg-white border border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1f293d] dark:border-[#1f293d] light:border-slate-200">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search events (e.g. E0408), identities (e.g. U003), threats, or workspaces..."
            className="w-full bg-transparent text-sm text-gray-100 dark:text-gray-100 light:text-slate-900 placeholder-gray-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-gray-400 hover:text-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] bg-[#1f293d] dark:bg-[#1f293d] light:bg-slate-100 text-gray-400 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-transparent">
          {results.length > 0 ? (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-950/60 dark:bg-cyan-950/60 light:bg-cyan-50 border border-cyan-800/60 text-white'
                      : 'hover:bg-[#111827] dark:hover:bg-[#111827] light:hover:bg-slate-50 text-gray-200 dark:text-gray-200 light:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[#111827] dark:bg-[#111827] light:bg-slate-100 border border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono truncate">{item.title}</span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase font-mono ${
                              item.badge === 'CRITICAL'
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : item.badge === 'HIGH'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-400 light:text-slate-500 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 shrink-0">
                    <span className="text-[10px] uppercase font-mono text-gray-500">{item.category}</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-gray-600'}`} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-400">
              <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-300">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-gray-500 mt-1">
                Try searching for event IDs (e.g. E0408), user IDs (e.g. U003), or page names.
              </p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2.5 bg-[#080b11] dark:bg-[#080b11] light:bg-slate-50 border-t border-[#1f293d] dark:border-[#1f293d] light:border-slate-200 text-[11px] text-gray-400 flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#111827] dark:bg-[#111827] light:bg-slate-200 rounded text-[10px]">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#111827] dark:bg-[#111827] light:bg-slate-200 rounded text-[10px]">↵</kbd> Select
            </span>
          </div>
          <span>SENTINEL Omnisearch</span>
        </div>
      </div>
    </div>
  );
};
