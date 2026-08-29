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
import { MLAssessmentCard } from '../components/investigation/MLAssessmentCard';
import { AICopilotCard } from '../components/investigation/AICopilotCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { Badge } from '../components/common/Badge';
import { ShieldAlert, ArrowLeft, Activity, Layers, FileText, CheckCircle2, AlertTriangle, Cpu, HelpCircle } from 'lucide-react';
import { IS_MOCK_MODE } from '../services';
import { RiskResult } from '../types/security';
import {
  formatEventType,
  formatContextStatus,
  formatSeverity,
  formatSequenceStep,
  formatSignal,
  formatTimestamp
} from '../utils/formatters';




const ProductionInvestigation: React.FC<{ risk: RiskResult; onBack: () => void }> = ({ risk, onBack }) => {
  const event = risk.event || {};
  const isHighOrCritical = risk.severity === 'HIGH' || risk.severity === 'CRITICAL';
  const hasHybrid = risk.hybrid_risk && risk.hybrid_risk.fusion_mode === 'hybrid_fusion_v1';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1f293d] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-[#111827] border border-[#1f293d] rounded-lg text-gray-400 hover:text-gray-100 hover:border-gray-600 transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-gray-100 uppercase font-mono">
                INVESTIGATION — {risk.event_id}
              </h1>
              <Badge variant="risk" riskLevel={risk.severity === 'MODERATE' ? 'MEDIUM' : (risk.severity as any)}>
                {formatSeverity(risk.severity)}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Subject User: <span className="font-mono font-bold text-cyan-400">{risk.user_id}</span> · Authorized access with behaviour deviation assessment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#111827] border border-[#1f293d] text-gray-300 font-mono text-xs rounded-lg">
            EVENT: <strong className="text-cyan-400">{risk.event_id}</strong>
          </span>
          <span className="px-3 py-1 bg-[#111827] border border-[#1f293d] text-gray-300 font-mono text-xs rounded-lg">
            ACTOR: <strong className="text-amber-400">{risk.user_id}</strong>
          </span>
        </div>
      </div>

      {/* Main Score & Engine Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Final Risk Score Card */}
        <div className="lg:col-span-5 p-6 bg-[#111827] border border-[#1f293d] rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assessed Risk Score</h2>
              <Badge variant="risk" riskLevel={risk.severity}>
                {formatSeverity(risk.severity)}
              </Badge>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-5xl font-black font-mono ${isHighOrCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                {risk.risk_score}
              </span>
              <span className="text-sm text-gray-500 font-mono">/ 100</span>
            </div>
            <p className={`text-xs font-bold uppercase mt-1 ${isHighOrCritical ? 'text-red-300' : 'text-emerald-300'}`}>
              {formatSeverity(risk.severity)} SEVERITY LEVEL
            </p>

            {hasHybrid && risk.hybrid_risk && (
              <div className="mt-3 px-3 py-1.5 bg-purple-950/40 border border-purple-800/40 rounded-lg flex items-center justify-between text-xs">
                <span className="text-purple-300 font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  Hybrid Risk Fusion:
                </span>
                <span className="font-mono font-bold text-purple-200">
                  {risk.hybrid_risk.hybrid_score} / 100
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-[#1f293d] space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center text-gray-400">
              <span className="font-sans">Behavioural Anomaly Score:</span>
              <strong className="text-gray-200">{risk.behaviour_score}</strong>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span className="font-sans">Multi-Step Sequence Score:</span>
              <strong className="text-gray-200">{risk.sequence_score}</strong>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span className="font-sans">Context Suppression Multiplier:</span>
              <strong className="text-cyan-400">{risk.context_multiplier}x</strong>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1f293d] text-[11px] font-mono text-gray-500">
            {hasHybrid && risk.hybrid_risk
              ? `Formula: ${risk.hybrid_risk.formula}`
              : 'Formula: clamp((behaviour * 0.6 + sequence * 0.4) * context, 0, 100)'}
          </div>
        </div>


        {/* Right: Rich Telemetry & Event Details Card */}
        <div className="lg:col-span-7 p-6 bg-[#111827] border border-[#1f293d] rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-[#1f293d] pb-2.5">
              <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                <FileText className="w-4 h-4 text-cyan-400" />
                Security Event Telemetry Details
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-[#0b0f17] border border-[#1f293d] text-cyan-400">
                {event.sensitivity_level || 'CONFIDENTIAL'}
              </span>
            </div>

            {/* Dense Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#0b0f17] p-3.5 rounded-lg border border-[#1f293d]">
              <div>
                <span className="text-gray-500 block text-[10px] font-mono">EVENT ID</span>
                <span className="font-mono font-bold text-cyan-300">{risk.event_id}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] font-mono">IDENTITY</span>
                <span className="font-mono font-bold text-gray-200">{risk.user_id}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] font-mono">EVENT TYPE</span>
                <span className="font-sans font-bold text-gray-200">{formatEventType(event.event_type)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] font-mono">TIMESTAMP</span>
                <span className="font-mono text-gray-300 text-[11px]">{formatTimestamp(event.timestamp, 'detailed')}</span>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px] font-mono">RESOURCE</span>
                <span className="font-mono text-gray-300">{event.resource_id || event.target_resource || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] font-mono">DEVICE FINGERPRINT</span>
                <span className="font-mono text-gray-300">{event.device_id || 'DEV-SEC-01'}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] font-mono">SOURCE IP</span>
                <span className="font-mono text-gray-300">{event.ip_address || '192.168.10.42'}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] font-mono">CONTEXT STATUS</span>
                <span className="font-mono text-amber-400 font-bold uppercase">{risk.context ? 'CONTEXT MATCHED' : 'UNMATCHED BASELINE'}</span>
              </div>
            </div>
          </div>

          {/* Behavior Signals Breakdown */}
          {risk.signals && risk.signals.length > 0 && (
            <div className="bg-[#0b0f17] p-3 rounded-lg border border-[#1f293d] space-y-2">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                Observed Behavioral Deviation Signals ({risk.signals.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {risk.signals.map((sig, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111827] border border-[#1f293d] rounded text-[11px] font-mono text-gray-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span className="font-bold text-red-300">{sig.signal || `SIGNAL_${i + 1}`}</span>
                    <span className="text-gray-400">({sig.description || 'Observed baseline deviation'})</span>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Sequence Context & Lookback Correlation */}
          {risk.sequence && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${risk.sequence.chain_detected ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`} />
                <span className="text-gray-400">Attack Chain Correlation:</span>
                <strong className={risk.sequence.chain_detected ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {risk.sequence.chain_detected ? 'MULTI-STAGE CHAIN DETECTED' : 'ISOLATED ACTIVITY (NO CHAIN)'}
                </strong>
              </div>
              <span className="text-gray-500 text-[11px]">Lookback Sequence Score: <strong className="text-cyan-400">{risk.sequence_score} / 100</strong></span>
            </div>
          )}

          {/* Transaction Amount Highlight if present */}
          {event.transaction_amount && Number(event.transaction_amount) > 0 && (
            <div className="p-2.5 bg-cyan-950/30 border border-cyan-800/40 rounded-lg flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-300">Monitored Transaction Volume:</span>
              <span className="font-bold text-cyan-300 text-sm">₹{Number(event.transaction_amount).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>


      {/* AI Investigation Copilot (Local Ollama) */}
      <AICopilotCard
        eventId={risk.event_id}
        initialNarrative={risk.narrative}
        initialStatus={risk.narrative_status}
        explainabilityFactors={risk.explainability_factors}
        riskLevel={risk.severity}
        userId={risk.user_id}
      />


      {/* ML Intelligence Card & Explainability Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <MLAssessmentCard mlAssessment={risk.ml_assessment} />
        </div>

        {/* Explainability Summary */}
        <div className="lg:col-span-5 p-6 bg-[#111827] border border-[#1f293d] rounded-xl flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              SOC Explainability Factors
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Automated audit summary of all contributing detection layers.
            </p>

            {risk.explainability_factors && risk.explainability_factors.length > 0 ? (
              <ul className="space-y-2">
                {risk.explainability_factors.map((factor, i) => (
                  <li key={i} className="p-2.5 bg-[#0b0f17] border border-[#1f293d] rounded text-xs text-gray-200 flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-3 bg-[#0b0f17] border border-[#1f293d] rounded text-xs text-gray-500">
                Baseline activity with no risk elevation factors.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signals & Sequence Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Behaviour Signals */}
        <div className="p-6 bg-[#111827] border border-[#1f293d] rounded-xl">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-amber-400" />
            Detected Behaviour Signals
          </h2>
          {risk.signals && risk.signals.length > 0 ? (
            <ul className="space-y-2.5">
              {risk.signals.map((s, idx) => (
                <li key={idx} className="p-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-xs flex items-start justify-between gap-3">
                  <div>
                    <span className="font-sans font-bold text-amber-400 block">{formatSignal(s.signal)}</span>
                    <span className="text-gray-300 text-[11px] mt-0.5 block">{s.description}</span>
                  </div>
                  <span className="font-mono font-bold text-red-400 shrink-0 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40 text-[10px]">
                    +{s.contribution}
                  </span>
                </li>

              ))}
            </ul>
          ) : (
            <div className="py-8 text-center text-xs text-gray-500 bg-[#0b0f17] rounded-lg border border-[#1f293d]">
              No anomalous behavioural deviation signals triggered for this event.
            </div>
          )}
        </div>

        {/* Sequence Chain */}
        <div className="p-6 bg-[#111827] border border-[#1f293d] rounded-xl">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-purple-400" />
            Sequence & Multi-Step Attack Correlation
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg flex items-center justify-between text-xs">
              <span className="text-gray-400">Attack Chain Detected:</span>
              <span className={`font-bold font-mono px-2 py-0.5 rounded ${risk.sequence.chain_detected ? 'text-red-400 bg-red-950/60 border border-red-800/40' : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40'}`}>
                {risk.sequence.chain_detected ? 'YES — CHAIN MATCHED' : 'NO CHAIN'}
              </span>
            </div>

            {risk.sequence.matched_steps && risk.sequence.matched_steps.length > 0 ? (
              <div className="p-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg">
                <span className="text-[10px] text-gray-500 block uppercase font-mono mb-2">Matched Sequence Progression</span>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  {risk.sequence.matched_steps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-2 py-1 bg-purple-950/80 text-purple-300 rounded border border-purple-800/50 font-sans font-semibold">
                        {formatSequenceStep(step.step)}
                      </span>
                      {idx < risk.sequence.matched_steps.length - 1 && (
                        <span className="text-gray-500">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-xs text-gray-500">
                No multi-step sequence progression matched in lookback window.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Assessment */}
      <div className="p-6 bg-[#111827] border border-[#1f293d] rounded-xl">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
          {risk.context.status === 'matched' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-gray-400" />
          )}
          Authorizing Operational Context
        </h2>
        <div className="p-4 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Context Match Status:</span>
            <span className="font-sans font-bold text-cyan-400">{formatContextStatus(risk.context.status)}</span>
          </div>
          <p className="text-gray-300">
            {risk.context.status === 'matched'
              ? 'Approved business window context was matched, suppressing baseline deviation severity.'
              : risk.context.status === 'none'
              ? 'No authorizing operational ticket or maintenance window was active at event timestamp.'
              : 'Context assessment evaluated with standard multiplier.'}

          </p>
          {risk.context.info && (
            <div className="mt-2 pt-2 border-t border-[#1f293d] flex gap-4 text-[11px] text-gray-400 font-mono">
              <span>Type: <strong className="text-gray-200">{risk.context.info.type}</strong></span>
              <span>Approved: <strong className="text-gray-200">{risk.context.info.manager_approval ? 'YES' : 'NO'}</strong></span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export const Investigation: React.FC = () => {
  const { eventId, userId } = useParams<{ eventId?: string; userId?: string }>();
  const navigate = useNavigate();

  const targetId = eventId || userId || '';
  const { identity, risk, baseline, peer, sequence, context, graph, isLoading, isError, error } =
    useInvestigationData(targetId);

  if (isLoading) return <LoadingSkeleton rows={10} />;

  if (isError) {
    const errorMsg = error instanceof Error ? error.message : String(error || '');
    const isNotFound = errorMsg.includes('404') || errorMsg.toLowerCase().includes('not found');
    return (
      <ErrorState
        title={isNotFound ? 'Event Not Found' : 'Unable to Retrieve Telemetry'}
        message={
          isNotFound
            ? `Security event '${targetId}' was not found in the runtime log records.`
            : `Unable to retrieve investigation data for ${targetId}.`
        }
        onRetry={() => navigate('/dashboard')}
        retryText="Back to Security Posture"
      />
    );
  }

  // Production mode: event risk result loaded from Flask API
  if (!IS_MOCK_MODE && risk && 'event_id' in risk) {
    return <ProductionInvestigation risk={risk} onBack={() => navigate(-1)} />;
  }

  // Mock mode: multi-panel investigation workspace
  if (risk && 'risk_level' in risk && identity) {
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

        {/* AI Investigation Copilot */}
        <AICopilotCard
          eventId={identity.top_event_id || identity.user_id}
          initialNarrative={null}
          explainabilityFactors={'explainability_factors' in risk ? (risk.explainability_factors as string[]) : ('signals' in risk ? (risk.signals as Array<{ description?: string }>).map((s) => s.description || '') : [])}
          riskLevel={'severity' in risk ? (risk.severity as string) : (risk.risk_level as string)}
          userId={identity.user_id}
        />



        {/* Hero Grid: Context Panel + Explainable Risk Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <ContextPanel identity={identity} />
          </div>
          <div className="lg:col-span-7">
            <RiskScoreBreakdown risk={risk} />
          </div>
        </div>

        {/* Response Action Panel */}
        <ResponseActionPanel
          userId={identity.user_id}
          recommendedAction={risk.recommended_action}
          riskLevel={risk.risk_level}
        />

        {/* Sequence Intelligence Timeline */}
        {sequence && <BehaviourSequenceTimeline sequence={sequence} />}

        {/* Baseline & Peer Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {baseline && <BaselineComparison metrics={baseline} />}
          {peer && <PeerAnalysis peerMetrics={peer} peerGroup={identity.peer_group} />}
        </div>

        {/* Contextual Assessment & Feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            {context && <ContextAssessmentCard context={context} />}
          </div>
          <div className="lg:col-span-5">
            <AnalystFeedbackModal userId={identity.user_id} />
          </div>
        </div>

        {/* Entity Relationship Topology Graph */}
        {graph && <RelationshipGraph data={graph} />}
      </div>
    );
  }

  return (
    <ErrorState
      title="Investigation Data Unavailable"
      message={`No investigation telemetry records were found for ${targetId || 'this event'}.`}
      onRetry={() => navigate('/dashboard')}
      retryText="Back to Security Posture"
    />
  );
};
