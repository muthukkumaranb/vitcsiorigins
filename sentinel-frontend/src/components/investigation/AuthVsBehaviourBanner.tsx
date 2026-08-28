import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export const AuthVsBehaviourBanner: React.FC = () => {
  return (
    <div className="bg-[var(--snt-navy-750)] border border-[var(--snt-navy-500)] rounded-sm p-4 mb-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Top red accent strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--snt-critical-text)] opacity-70" />

      <div className="flex items-center gap-4">
        <div className="p-2 bg-[var(--snt-critical-bg)] text-[var(--snt-critical-text)] rounded-sm border border-[var(--snt-critical-border)]">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="snt-heading text-sm uppercase tracking-wide flex items-center gap-2">
            Authorized Access <span className="text-[var(--snt-text-secondary)]">≠</span> Authorized Behaviour
            <span className="px-1.5 py-0.5 bg-[var(--snt-critical-bg)] text-[var(--snt-critical-text)] border border-[var(--snt-critical-border)] font-mono text-[9px] rounded-sm tracking-widest ml-2">USP</span>
          </h3>
          <p className="text-[11px] text-[var(--snt-text-secondary)] mt-1 max-w-xl leading-relaxed">
            User possesses valid credentials and legitimate IAM permissions, but the sequence, timing, and behavioral metrics indicate critical anomaly.
          </p>
        </div>
      </div>

      {/* 4-Step Flow */}
      <div className="flex items-center shrink-0 bg-[var(--snt-navy-800)] p-2 rounded-sm border border-[var(--snt-navy-500)]">
        {/* Step 1 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--snt-safe-bg)] border border-[var(--snt-safe-border)] rounded-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--snt-safe-text)]" />
          <div>
            <div className="text-[8px] font-bold text-[var(--snt-safe-text)] opacity-70 uppercase tracking-widest">ACCESS</div>
            <div className="text-[10px] font-bold text-[var(--snt-safe-text)] font-mono tracking-wide">✓ AUTHORIZED</div>
          </div>
        </div>

        <div className="w-4 h-[1px] bg-[var(--snt-navy-400)] mx-1" />

        {/* Step 2 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--snt-medium-bg)] border border-[var(--snt-medium-border)] rounded-sm">
          <div>
            <div className="text-[8px] font-bold text-[var(--snt-medium-text)] opacity-70 uppercase tracking-widest">BEHAVIOUR</div>
            <div className="text-[10px] font-bold text-[var(--snt-medium-text)] font-mono tracking-wide">⚠ DEVIATING</div>
          </div>
        </div>

        <div className="w-4 h-[1px] bg-[var(--snt-navy-400)] mx-1" />

        {/* Step 3 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--snt-high-bg)] border border-[var(--snt-high-border)] rounded-sm">
          <div>
            <div className="text-[8px] font-bold text-[var(--snt-high-text)] opacity-70 uppercase tracking-widest">CONTEXT</div>
            <div className="text-[10px] font-bold text-[var(--snt-high-text)] font-mono tracking-wide">HIGH RISK</div>
          </div>
        </div>

        <div className="w-4 h-[1px] bg-[var(--snt-critical-border)] mx-1" />

        {/* Step 4 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--snt-critical-bg)] border border-[var(--snt-critical-border)] rounded-sm relative overflow-hidden">
          <div className="absolute inset-0 border border-[var(--snt-critical-text)] opacity-20 pointer-events-none" />
          <div>
            <div className="text-[8px] font-bold text-[var(--snt-critical-text)] opacity-70 uppercase tracking-widest">RESPONSE</div>
            <div className="text-[10px] font-bold text-[var(--snt-critical-text)] font-mono tracking-wide flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[var(--snt-critical-text)] rounded-full animate-pulse-live" />
              SUSPEND + ESCALATE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
