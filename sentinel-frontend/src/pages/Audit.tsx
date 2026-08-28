import React, { useState, useMemo } from 'react';
import { useAuditLogsData } from '../hooks/useSecurityData';
import { IS_MOCK_MODE } from '../services';
import { AuditTable } from '../components/audit/AuditTable';
import { AuditDetailModal } from '../components/audit/AuditDetailModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { AuditEventItem } from '../types/security';
import {
  Search,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Activity,
  Layers
} from 'lucide-react';

export const Audit: React.FC = () => {
  const { data: auditResponse, isLoading, isError, refetch } = useAuditLogsData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [sortColumn, setSortColumn] = useState<'timestamp' | 'risk_score' | 'severity' | 'event_id'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [selectedEvent, setSelectedEvent] = useState<AuditEventItem | null>(null);

  const allItems: AuditEventItem[] = useMemo(() => auditResponse?.items || [], [auditResponse]);

  // Summary Metrics calculated from actual data
  const summaryMetrics = useMemo(() => {
    let critical = 0;
    let high = 0;
    let moderate = 0;
    let low = 0;

    for (const item of allItems) {
      const sev = item.severity?.toUpperCase();
      if (sev === 'CRITICAL' || item.risk_score >= 75) critical++;
      else if (sev === 'HIGH' || item.risk_score >= 50) high++;
      else if (sev === 'MODERATE' || sev === 'MEDIUM' || item.risk_score >= 25) moderate++;
      else low++;
    }

    return {
      total: allItems.length,
      critical,
      high,
      moderate,
      low
    };
  }, [allItems]);

  // Distinct event types and users for filter dropdowns
  const availableEventTypes = useMemo(() => {
    const set = new Set<string>();
    for (const item of allItems) {
      if (item.event_type) set.add(item.event_type);
    }
    return Array.from(set).sort();
  }, [allItems]);

  const availableUsers = useMemo(() => {
    const set = new Set<string>();
    for (const item of allItems) {
      if (item.user_id) set.add(item.user_id);
    }
    return Array.from(set).sort();
  }, [allItems]);

  // Filtered & Sorted items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...allItems];

    // Search filter across Event ID, User ID, and Event Type
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.event_id.toLowerCase().includes(q) ||
          item.user_id.toLowerCase().includes(q) ||
          item.event_type.toLowerCase().includes(q)
      );
    }

    // Severity filter
    if (selectedSeverity !== 'ALL') {
      result = result.filter((item) => {
        const itemSev = item.severity?.toUpperCase();
        if (selectedSeverity === 'MODERATE' || selectedSeverity === 'MEDIUM') {
          return itemSev === 'MODERATE' || itemSev === 'MEDIUM';
        }
        return itemSev === selectedSeverity;
      });
    }

    // Event Type filter
    if (selectedEventType !== 'ALL') {
      result = result.filter(
        (item) => item.event_type.toLowerCase() === selectedEventType.toLowerCase()
      );
    }

    // User ID filter
    if (selectedUser !== 'ALL') {
      result = result.filter((item) => item.user_id === selectedUser);
    }

    // Sorting
    const reverse = sortDirection === 'desc';
    result.sort((a, b) => {
      if (sortColumn === 'risk_score') {
        return reverse ? b.risk_score - a.risk_score : a.risk_score - b.risk_score;
      }
      if (sortColumn === 'severity') {
        const rank: Record<string, number> = { CRITICAL: 4, HIGH: 3, MODERATE: 2, MEDIUM: 2, LOW: 1 };
        return reverse
          ? (rank[b.severity] || 0) - (rank[a.severity] || 0)
          : (rank[a.severity] || 0) - (rank[b.severity] || 0);
      }
      if (sortColumn === 'event_id') {
        return reverse ? b.event_id.localeCompare(a.event_id) : a.event_id.localeCompare(b.event_id);
      }
      // default timestamp
      return reverse ? b.timestamp.localeCompare(a.timestamp) : a.timestamp.localeCompare(b.timestamp);
    });

    return result;
  }, [allItems, searchQuery, selectedSeverity, selectedEventType, selectedUser, sortColumn, sortDirection]);

  // Pagination calculation
  const totalFiltered = filteredAndSortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredAndSortedItems.slice(start, start + pageSize);
  }, [filteredAndSortedItems, validCurrentPage, pageSize]);

  const handleSort = (column: 'timestamp' | 'risk_score' | 'severity' | 'event_id') => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSeverity('ALL');
    setSelectedEventType('ALL');
    setSelectedUser('ALL');
    setSortColumn('timestamp');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-[#1f293d] pb-4">
          <h1 className="text-xl font-black text-gray-100 uppercase tracking-wide">Audit Log</h1>
          <p className="text-xs text-gray-400">Loading audit events...</p>
        </div>
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="border-b border-[#1f293d] pb-4">
          <h1 className="text-xl font-black text-gray-100 uppercase tracking-wide">Audit Log</h1>
          <p className="text-xs text-gray-400">Chronological history of security events and risk assessments.</p>
        </div>
        <ErrorState
          message="Unable to load audit events from the backend service."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f293d] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-gray-100 uppercase tracking-wide">Audit Log</h1>
            {IS_MOCK_MODE && (
              <span className="text-[10px] font-mono text-yellow-400 bg-yellow-950/60 border border-yellow-800 px-2 py-0.5 rounded font-bold">
                MOCK / DEMO DATA MODE
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Chronological history of security events and risk assessments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400 bg-[#111827] border border-[#1f293d] px-3 py-1 rounded">
            Dataset: <span className="text-cyan-400 font-bold">{summaryMetrics.total}</span> Runtime Events
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#111827] border border-[#1f293d] p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Events</div>
            <div className="text-2xl font-black font-mono text-gray-100 mt-1">{summaryMetrics.total}</div>
          </div>
          <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111827] border border-red-900/40 p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Critical Risk</div>
            <div className="text-2xl font-black font-mono text-red-400 mt-1">{summaryMetrics.critical}</div>
          </div>
          <div className="p-2 bg-red-950/60 rounded-lg text-red-400 border border-red-800/40">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111827] border border-orange-900/40 p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">High Risk</div>
            <div className="text-2xl font-black font-mono text-orange-400 mt-1">{summaryMetrics.high}</div>
          </div>
          <div className="p-2 bg-orange-950/60 rounded-lg text-orange-400 border border-orange-800/40">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111827] border border-yellow-900/40 p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Medium / Moderate</div>
            <div className="text-2xl font-black font-mono text-yellow-400 mt-1">{summaryMetrics.moderate}</div>
          </div>
          <div className="p-2 bg-yellow-950/60 rounded-lg text-yellow-400 border border-yellow-800/40">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111827] border border-emerald-900/40 p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Low Risk</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{summaryMetrics.low}</div>
          </div>
          <div className="p-2 bg-emerald-950/60 rounded-lg text-emerald-400 border border-emerald-800/40">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Functional Filter & Search Bar */}
      <div className="bg-[#111827] border border-[#1f293d] p-4 rounded-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search Event ID, User, or Event Type..."
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Severity Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 font-sans"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical (75 - 100)</option>
              <option value="HIGH">High (50 - 74)</option>
              <option value="MODERATE">Moderate / Medium (25 - 49)</option>
              <option value="LOW">Low (0 - 24)</option>
            </select>
          </div>

          {/* Event Type Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={selectedEventType}
              onChange={(e) => {
                setSelectedEventType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 font-sans"
            >
              <option value="ALL">All Event Types</option>
              {availableEventTypes.map((type) => (
                <option key={type} value={type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* User ID Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="ALL">All Users</option>
              {availableUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="sm:col-span-1 flex items-center justify-end">
            <button
              onClick={handleResetFilters}
              title="Reset all filters"
              className="w-full flex items-center justify-center gap-1 bg-[#1a2333] hover:bg-[#223046] border border-[#1f293d] text-gray-300 px-3 py-2 rounded text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter metadata summary */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-[#1f293d]/50">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>
              Showing <span className="text-gray-200 font-bold">{totalFiltered}</span> of{' '}
              <span className="text-gray-200">{summaryMetrics.total}</span> events
            </span>
            {(searchQuery || selectedSeverity !== 'ALL' || selectedEventType !== 'ALL' || selectedUser !== 'ALL') && (
              <span className="text-cyan-400 font-semibold">(Filtered)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#0b0f17] border border-[#1f293d] rounded px-2 py-0.5 text-xs text-gray-200 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Audit Table or Empty State */}
      {paginatedItems.length > 0 ? (
        <div className="space-y-3">
          <AuditTable
            logs={paginatedItems}
            onSelectEvent={(event) => setSelectedEvent(event)}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          {/* Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111827] border border-[#1f293d] px-4 py-3 rounded-lg text-xs text-gray-400">
            <div>
              Showing <span className="text-gray-200 font-semibold">{(validCurrentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="text-gray-200 font-semibold">
                {Math.min(validCurrentPage * pageSize, totalFiltered)}
              </span>{' '}
              of <span className="text-gray-200 font-semibold">{totalFiltered}</span> events
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded bg-[#1a2333] hover:bg-[#223046] disabled:opacity-40 disabled:cursor-not-allowed border border-[#1f293d] text-gray-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-mono text-gray-200">
                Page {validCurrentPage} of {totalPages}
              </span>

              <button
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded bg-[#1a2333] hover:bg-[#223046] disabled:opacity-40 disabled:cursor-not-allowed border border-[#1f293d] text-gray-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No audit events found"
          description="No security events match the current search filters. Click Reset to view all runtime audit records."
        />
      )}

      {/* Detail Inspection Modal */}
      <AuditDetailModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};
