import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvestigationData } from '../hooks/useSecurityData';
import { AuthVsBehaviourBanner } from '../components/investigation/AuthVsBehaviourBanner';
import { ContextPanel } from '../components/investigation/ContextPanel';
import { RiskScoreBreakdown } from '../components/investigation/RiskScoreBreakdown';
import { BaselineComparison } from '../components/investigation/BaselineComparison';
import { PeerAnalysis } from '../components/investigation/PeerAnalysis';
import { BehaviourSequenceTimeline } from '../components/investigation/BehaviourSequenceTimeline';
import { ContextAssessmentCard } from '../components/investigation/ContextAssessmentCard';
import { RelationshipGraph } from '../components/investigation/RelationshipGraph';
import { ResponseActionPanel } from '../components/investigation/ResponseActionPanel';
import { AnalystFeedbackModal } from '../components/investigation/AnalystFeedbackModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { IS_MOCK_MODE } from '../services';
import { RiskResult } from '../types/security';

const ProductionInvestigation: React.FC<{ risk: RiskResult; onBack: () => void }> = ({ risk, onBack }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 border-b border-[#1f293d] pb-4">
      <button onClick={onBack} className="p-2 bg-[#111827] border border-[#1f293d] rounded-lg text-gray-400" title="Back to Threat Center">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div>
        <h1 className="text-xl font-black tracking-tight text-gray-100 uppercase">INVESTIGATION — {risk.event_id}</h1>
        <p className="text-xs text-gray-400">{risk.user_id} · Authorized access with behaviour deviation assessment</p>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-6 bg-[#111827] border border-[#1f293d] rounded-xl">
        <h2 className="text-sm font-bold text-gray-100 uppercase">Final Risk</h2>
        <p className="text-4xl font-black font-mono text-red-400 mt-3">{risk.risk_score} <span className="text-sm text-gray-500">/ 100</span></p>
        <p className="text-xs font-bold text-red-300 mt-2">{risk.severity}</p>
        <div className="mt-5 text-xs text-gray-300 space-y-2">
          <p>Behaviour score: <strong>{risk.behaviour_score}</strong></p>
          <p>Sequence score: <strong>{risk.sequence_score}</strong></p>
          <p>Context multiplier: <strong>{risk.context_multiplier}</strong></p>
        </div>
      </div>
      <div className="p-6 bg-[#111827] border border-[#1f293d] rounded-xl">
        <h2 className="text-sm font-bold text-gray-100 uppercase">Behaviour Signals</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-300">{risk.signals.length ? risk.signals.map((signal) => <li key={signal.signal}>{signal.signal}: {signal.description} (+{signal.contribution})</li>) : <li>None</li>}</ul>
        <h2 className="text-sm font-bold text-gray-100 uppercase mt-6">Sequence</h2>
        <p className="text-xs text-gray-300 mt-2">Chain detected: {risk.sequence.chain_detected ? 'Yes' : 'No'}</p>
        <p className="text-xs text-gray-300 mt-2">{risk.sequence.matched_steps.length ? risk.sequence.matched_steps.map((step) => step.step).join(' → ') : 'No matched steps'}</p>
      </div>
    </div>
    <div className="p-6 bg-[#111827] border border-[#1f293d] rounded-xl">
      <h2 className="text-sm font-bold text-gray-100 uppercase">Context</h2>
      <p className="text-sm text-gray-300 mt-3">{risk.context.status === 'matched' ? 'Approved context found; context reduced assessed risk.' : risk.context.status === 'none' ? 'No matching context.' : 'Context is ambiguous and was not applied.'}</p>
      {risk.context.info && <p className="text-xs text-gray-400 mt-2">{risk.context.info.type} · approval: {risk.context.info.manager_approval ? 'yes' : 'no'}</p>}
    </div>
    <div className="p-6 bg-[#111827] border border-[#1f293d] rounded-xl">
      <h2 className="text-sm font-bold text-gray-100 uppercase">Explainable Risk Breakdown</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">{Object.entries(risk.risk_breakdown).map(([name, score]) => <div key={name} className="text-xs text-gray-300"><span className="block text-gray-500">{name}</span><strong>{score}</strong></div>)}</div>
    </div>
  </div>
);

export const Investigation: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const targetUserId = userId || '';
  const { identity, risk, baseline, peer, sequence, context, graph, isLoading, isError } =
    useInvestigationData(targetUserId);

  if (isLoading) return <LoadingSkeleton rows={10} />;
  if (!IS_MOCK_MODE && risk && 'event_id' in risk) {
    return <ProductionInvestigation risk={risk} onBack={() => navigate('/threats')} />;
  }
  if (!risk || !('risk_level' in risk)) {
    return <ErrorState message={`No investigation result was returned for ${targetUserId || 'this event'}.`} />;
  }
  if (isError || !identity || !risk || !baseline || !peer || !sequence || !context || !graph) {
    return <ErrorState message={`Failed to load investigation telemetry for ${targetUserId}.`} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1f293d] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/threats')}
            className="p-2 bg-[#111827] border border-[#1f293d] rounded-lg text-gray-400 hover:text-gray-100 hover:border-gray-600 transition-colors cursor-pointer"
            title="Back to Threat Center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-100 uppercase flex items-center gap-2 font-mono">
              <ShieldAlert className="w-6 h-6 text-red-400" />
              INVESTIGATION WORKSPACE — {identity.user_id}
            </h1>
            <p className="text-xs text-gray-400">
              Deep forensic correlation & threat assessment console ({identity.role} - {identity.department})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-red-950/80 border border-red-800 text-red-400 font-mono font-bold text-xs rounded-lg">
            CRITICAL INCIDENT #{identity.user_id}
          </span>
        </div>
      </div>

      {/* USP 1 Banner: Authorized Access vs Authorized Behaviour */}
      <AuthVsBehaviourBanner />

      {/* Hero Grid: Context Panel (Sec 16) + Explainable Risk Breakdown (Sec 17 / USP 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <ContextPanel identity={identity} />
        </div>
        <div className="lg:col-span-7">
          <RiskScoreBreakdown risk={risk} />
        </div>
      </div>

      {/* Response Action Panel: Graduated Response (Sec 23 / USP 7) */}
      <ResponseActionPanel
        userId={identity.user_id}
        recommendedAction={risk.recommended_action}
        riskLevel={risk.risk_level}
      />

      {/* Sequence Intelligence Timeline (Sec 20 / USP 3) */}
      <BehaviourSequenceTimeline sequence={sequence} />

      {/* Baseline (Sec 18 / USP 2) & Peer Comparison (Sec 19 / USP 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BaselineComparison metrics={baseline} />
        <PeerAnalysis peerMetrics={peer} peerGroup={identity.peer_group} />
      </div>

      {/* Contextual Assessment (Sec 21 / USP 5) & Continuous Learning Feedback (Sec 24 / USP 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ContextAssessmentCard context={context} />
        </div>
        <div className="lg:col-span-5">
          <AnalystFeedbackModal userId={identity.user_id} />
        </div>
      </div>

      {/* Interactive Entity Relationship Topology Graph (Sec 22) */}
      <RelationshipGraph data={graph} />
    </div>
  );
};
