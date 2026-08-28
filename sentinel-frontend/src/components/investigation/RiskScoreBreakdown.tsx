import React from 'react';
import { Card } from '../common/Card';
import { RiskAssessment } from '../../types/security';
import { ShieldAlert } from 'lucide-react';

interface RiskScoreBreakdownProps {
  risk: RiskAssessment;
}

export const RiskScoreBreakdown: React.FC<RiskScoreBreakdownProps> = ({ risk }) => {

  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--snt-navy-500)] mb-4">
        <h3 className="snt-heading text-sm text-[var(--snt-text-primary)] uppercase flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[var(--snt-critical-text)]" />
          Explainable Risk Decomposition (USP 6)
        </h3>
        <span className="text-[9px] text-[var(--snt-text-tertiary)] font-mono border border-[var(--snt-navy-500)] px-1.5 py-0.5 rounded-sm">ISOLATION FOREST v1.0</span>
      </div>

      {/* Main Score Visual - Instrument Style */}
      <div className="flex items-stretch gap-px bg-[var(--snt-navy-500)] mb-6 border border-[var(--snt-navy-500)] rounded-sm overflow-hidden">
        
        {/* Risk Score */}
        <div className="flex-1 bg-[var(--snt-navy-800)] p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--snt-critical-text)]" />
          <div className="pl-2">
            <div className="snt-instrument-label">Composite Risk Score</div>
            <div className="text-4xl font-light font-['IBM_Plex_Mono',monospace] text-[var(--snt-critical-text)] mt-1">
              {risk.risk_score}
              <span className="text-sm text-[var(--snt-text-tertiary)] font-normal ml-1">/ 100</span>
            </div>
            <div className="text-[10px] font-bold text-[var(--snt-critical-text)] mt-2 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-sm bg-[var(--snt-critical-text)]" />
              {risk.risk_level}
            </div>
          </div>
        </div>

        {/* Trust Score */}
        <div className="flex-1 bg-[var(--snt-navy-800)] p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--snt-accent)]" />
          <div className="pl-2">
            <div className="snt-instrument-label">Behavioural Trust</div>
            <div className="text-3xl font-light font-['IBM_Plex_Mono',monospace] text-[var(--snt-text-secondary)] mt-2">
              {risk.trust_score}
              <span className="text-xs text-[var(--snt-text-tertiary)] font-normal ml-1">/ 100</span>
            </div>
            <div className="text-[10px] font-bold text-[var(--snt-high-text)] mt-2 uppercase tracking-widest">
              DEGRADED BASELINE
            </div>
          </div>
        </div>
      </div>

      {/* Risk Factors Breakdown Bars */}
      <div className="space-y-3 flex-1">
        <div className="text-[10px] font-bold text-[var(--snt-text-tertiary)] uppercase tracking-wider flex items-center justify-between pb-1 border-b border-[var(--snt-navy-500)]">
          <span>Risk Contributors</span>
          <span>Score Delta</span>
        </div>

        {risk.risk_factors.map((factor, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--snt-text-primary)]">{factor.name}</span>
              <span className="font-mono font-bold text-[var(--snt-critical-text)] text-[10px]">+{factor.score}</span>
            </div>
            {/* Restrained horizontal bar */}
            <div className="w-full h-1.5 bg-[var(--snt-navy-950)] rounded-sm overflow-hidden border border-[var(--snt-navy-500)]">
              <div
                style={{ width: `${(factor.score / 30) * 100}%` }}
                className="h-full bg-[var(--snt-critical-text)] rounded-r-sm"
              />
            </div>
            <p className="text-[10px] text-[var(--snt-text-tertiary)] leading-tight">{factor.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
