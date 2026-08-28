import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInvestigationData } from '../hooks/useSecurityData';
import { AuthVsBehaviourBanner } from '../components/investigation/AuthVsBehaviourBanner';
import { ContextPanel } from '../components/investigation/ContextPanel';
import { RiskScoreBreakdown } from '../components/investigation/RiskScoreBreakdown';
import { BehaviourSequenceTimeline } from '../components/investigation/BehaviourSequenceTimeline';
import { BaselineComparison } from '../components/investigation/BaselineComparison';
import { PeerAnalysis } from '../components/investigation/PeerAnalysis';
import { ContextAssessmentCard } from '../components/investigation/ContextAssessmentCard';
import { RelationshipGraph } from '../components/investigation/RelationshipGraph';
import { ResponseActionPanel } from '../components/investigation/ResponseActionPanel';
import { ArrowLeft, UserX, Copy } from 'lucide-react';
import { clsx } from 'clsx';

export const Investigation: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { identity, risk, baseline, peer, sequence, context, graph, isLoading, isError } = useInvestigationData(userId || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--snt-accent)] border-t-transparent rounded-full animate-spin"></div>
          <div className="snt-label text-[var(--snt-accent)] text-[10px] tracking-widest">COMPILE FORENSIC DOSSIER...</div>
        </div>
      </div>
    );
  }

  if (isError || !identity) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <div className="p-4 bg-[var(--snt-critical-bg)] border border-[var(--snt-critical-border)] rounded-sm text-[var(--snt-critical-text)] mb-4">
          <UserX className="w-8 h-8 mb-2 mx-auto" />
          <h2 className="text-sm font-bold font-['Space_Grotesk',sans-serif] uppercase tracking-wide">Identity Not Found</h2>
        </div>
        <p className="text-[11px] text-[var(--snt-text-secondary)] mb-6 font-mono">ID: {userId} does not exist in the active directory telemetry.</p>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-[var(--snt-navy-750)] border border-[var(--snt-navy-500)] text-[var(--snt-text-primary)] rounded-sm text-[11px] uppercase tracking-wider font-bold hover:bg-[var(--snt-navy-700)] transition-colors"
        >
          Return to Command Center
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 fade-in">
      {/* Header - Forensic Style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--snt-navy-500)]">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[var(--snt-text-tertiary)] hover:text-[var(--snt-text-primary)] mb-3 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-[var(--snt-text-primary)] font-['Space_Grotesk',sans-serif] tracking-tight">Forensic Investigation</h1>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-[var(--snt-navy-950)] border border-[var(--snt-navy-500)] rounded-sm">
              <span className="text-[10px] text-[var(--snt-text-tertiary)] uppercase tracking-wider font-bold">TARGET ID</span>
              <span className="text-sm font-bold text-[var(--snt-accent-light)] font-mono tracking-wider">{identity.user_id}</span>
              <button className="text-[var(--snt-text-tertiary)] hover:text-[var(--snt-text-primary)] transition-colors ml-1" title="Copy ID">
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={clsx(
            "px-4 py-2 border rounded-sm flex items-center gap-3",
            identity.status === 'CRITICAL' ? 'bg-[var(--snt-critical-bg)] border-[var(--snt-critical-border)] text-[var(--snt-critical-text)]' : 'bg-[var(--snt-high-bg)] border-[var(--snt-high-border)] text-[var(--snt-high-text)]'
          )}>
            <div className="text-[9px] font-bold uppercase tracking-widest opacity-80">ACTIVE INCIDENT</div>
            <div className="h-4 w-px bg-current opacity-30" />
            <div className="text-xs font-bold font-mono tracking-wider">INC-2026-08-091A</div>
          </div>
        </div>
      </div>

      <AuthVsBehaviourBanner />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <ContextPanel identity={identity} />
          {risk && <RiskScoreBreakdown risk={risk} />}
          {context && <ContextAssessmentCard context={context} />}
        </div>
        <div className="lg:col-span-8 flex flex-col gap-6">
          {sequence && <BehaviourSequenceTimeline sequence={sequence} />}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {baseline && <BaselineComparison metrics={baseline} />}
            {peer && <PeerAnalysis peerMetrics={peer} peerGroup={identity.peer_group} />}
          </div>
          {graph && <RelationshipGraph data={graph} />}
        </div>
      </div>

      {/* Fixed Bottom Action Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--snt-navy-800)] border-t border-[var(--snt-navy-500)] p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:pl-64">
        <div className="max-w-[1400px] mx-auto">
          <ResponseActionPanel
            userId={identity.user_id}
            recommendedAction={risk?.recommended_action || 'MONITOR'}
            riskLevel={identity.status}
          />
        </div>
      </div>
    </div>
  );
};

