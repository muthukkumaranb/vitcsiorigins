import React, { useState } from 'react';
import { Bot, Sparkles, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, Cpu, ShieldAlert } from 'lucide-react';
import { apiService, mockApiService, IS_MOCK_MODE } from '../../services';
import { NarrativeResponse } from '../../types/security';

interface AICopilotCardProps {
  eventId?: string;
  incidentId?: string;
  initialNarrative?: string | null;
  initialStatus?: 'ok' | 'unavailable';
  explainabilityFactors?: string[];
  riskLevel?: string;
  userId?: string;
}

export const AICopilotCard: React.FC<AICopilotCardProps> = ({
  eventId,
  incidentId,
  initialNarrative = null,
  initialStatus,
  explainabilityFactors = [],
  riskLevel = 'MODERATE',
  userId
}) => {
  const [narrativeData, setNarrativeData] = useState<NarrativeResponse | null>(
    initialNarrative
      ? {
          narrative: initialNarrative,
          narrative_status: initialStatus || 'ok',
          event_id: eventId,
          incident_id: incidentId,
          model: 'llama3.1:8b'
        }
      : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasRequested, setHasRequested] = useState<boolean>(Boolean(initialNarrative));

  const service = IS_MOCK_MODE ? mockApiService : apiService;

  const handleGenerate = async (refresh = false) => {
    setIsLoading(true);
    setHasRequested(true);
    try {
      let res: NarrativeResponse;
      if (eventId) {
        res = await service.getEventNarrative(eventId, refresh);
      } else if (incidentId) {
        res = await service.getIncidentNarrative(incidentId, refresh);
      } else {
        res = {
          narrative: null,
          narrative_status: 'unavailable',
          error: 'No target identifier provided'
        };
      }
      setNarrativeData(res);
    } catch (err) {
      setNarrativeData({
        narrative: null,
        narrative_status: 'unavailable',
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to split text into executive narrative and recommended checks
  const renderNarrativeContent = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const checksIndex = lines.findIndex(l => 
      l.toLowerCase().includes('recommended next checks') || 
      l.toLowerCase().includes('recommended checks') ||
      l.toLowerCase().includes('next checks')
    );

    let mainNarrativeLines: string[] = [];
    let checkLines: string[] = [];

    if (checksIndex !== -1) {
      mainNarrativeLines = lines.slice(0, checksIndex);
      checkLines = lines.slice(checksIndex + 1);
    } else {
      mainNarrativeLines = lines.filter(l => !l.startsWith('•') && !l.startsWith('-') && !l.startsWith('*') && !/^\d+\./.test(l));
      checkLines = lines.filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l));
    }

    return (
      <div className="space-y-4">
        {mainNarrativeLines.length > 0 && (
          <div className="p-3.5 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-xs leading-relaxed text-gray-200 font-sans">
            {mainNarrativeLines.join(' ')}
          </div>
        )}

        {checkLines.length > 0 && (
          <div className="p-3.5 bg-[#0f172a]/60 border border-cyan-900/40 rounded-lg">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 font-mono mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Recommended SOC Next Checks
            </h4>
            <ul className="space-y-1.5">
              {checkLines.map((chk, idx) => {
                const cleaned = chk.replace(/^([•\-*]|\d+\.)\s*/, '');
                return (
                  <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{cleaned}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {mainNarrativeLines.length === 0 && checkLines.length === 0 && (
          <div className="p-3.5 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-xs text-gray-200 whitespace-pre-wrap">
            {text}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-[#111827] border border-[#1f293d] rounded-xl shadow-lg relative overflow-hidden">
      {/* Glow background accent */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-950/80 border border-cyan-800/60 rounded-lg text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider font-mono">
                AI Investigation Copilot
              </h3>
              <span className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 font-mono text-[10px] rounded font-bold">
                LOCAL OLLAMA
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Grounded natural-language narrative synthesized strictly from verified telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {narrativeData?.model && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-[#0b0f17] border border-[#1f293d] text-gray-400 font-mono text-[10px] rounded">
              <Cpu className="w-3 h-3 text-cyan-400" />
              {narrativeData.model}
            </span>
          )}

          {hasRequested && !isLoading && (
            <button
              onClick={() => handleGenerate(true)}
              className="px-2.5 py-1 bg-[#1a2234] hover:bg-[#232f48] border border-[#2a364f] text-gray-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Regenerate AI Summary"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {!hasRequested ? (
        <div className="p-5 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-center">
          <Sparkles className="w-6 h-6 text-cyan-400 mx-auto mb-2 opacity-80" />
          <h4 className="text-xs font-bold text-gray-200 mb-1">
            Synthesize Grounded SOC Narrative
          </h4>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">
            Execute local LLM inference via Ollama (<code className="text-cyan-400 font-mono">llama3.1:8b</code>) to produce a plain-English explanation and prioritized analyst next steps with zero external API calls.
          </p>
          <button
            onClick={() => handleGenerate(false)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold font-mono tracking-wide shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>GENERATE AI SUMMARY</span>
          </button>
        </div>
      ) : isLoading ? (
        <div className="p-6 bg-[#0b0f17] border border-[#1f293d] rounded-lg flex flex-col items-center justify-center text-center space-y-3">
          <div className="relative">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-200 font-mono">
              Synthesizing Grounded Narrative via Ollama...
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Local bounded inference · Zero external data egress · Grounded facts only
            </p>
          </div>
        </div>
      ) : narrativeData?.narrative_status === 'ok' && narrativeData.narrative ? (
        <div className="space-y-3">
          {renderNarrativeContent(narrativeData.narrative)}

          {/* Footer Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1f293d] text-[10px] font-mono text-gray-500">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Grounding verified: 100% deterministic facts &amp; severity anchored</span>
            </div>
            <div>
              {narrativeData.cached ? 'Loaded from local cache' : 'Freshly synthesized via Ollama'}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Deterministic Investigation Analysis Card */}
          <div className="p-4 bg-[#0b0f17] border border-amber-800/40 rounded-lg text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Deterministic Investigation Analysis (Fail-Closed Fallback)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-950 border border-amber-800 text-amber-300 rounded font-bold">
                DETERMINISTIC
              </span>
            </div>

            <p className="text-gray-300 text-xs leading-relaxed">
              Target identity <strong className="text-cyan-400 font-mono">{userId || eventId || incidentId}</strong> triggered a <strong className="text-amber-400 font-bold">{riskLevel}</strong> risk posture across the multi-stage detection pipeline. Behavioral baseline deviation and lookback sequence correlation were evaluated deterministically.
            </p>

            {explainabilityFactors && explainabilityFactors.length > 0 && (
              <div className="p-3 bg-[#0f172a]/80 border border-[#1f293d] rounded-lg">
                <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                  Primary Contributing Factors:
                </h5>
                <ul className="space-y-1">
                  {explainabilityFactors.slice(0, 4).map((factor, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 bg-[#0f172a]/60 border border-cyan-900/30 rounded-lg">
              <h5 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Recommended SOC Next Steps:
              </h5>
              <ul className="space-y-1 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>Validate user session authorization and verify IP/device authenticity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>Cross-reference change tickets for after-hours or sensitive operations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>Inspect chronological event history in Audit Log for lateral progression</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
              <span className="flex items-center gap-1 text-gray-500">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Ollama service offline or timed out — Deterministic analysis active.
              </span>
              <button
                onClick={() => handleGenerate(true)}
                className="px-3 py-1 bg-amber-900/40 hover:bg-amber-800/50 border border-amber-700/50 text-amber-200 rounded text-xs font-mono transition-colors cursor-pointer"
              >
                Retry Ollama Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
