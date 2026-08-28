import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export const AuthVsBehaviourBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-[#111827] via-[#161f30] to-[#111827] border-2 border-red-500/40 rounded-xl p-4 mb-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-white font-mono text-[10px] font-bold tracking-widest rounded-bl-lg uppercase">
        CORE PRODUCT USP
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/30">
            <AlertTriangle className="w-6 h-6 animate-pulse-live" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-100 uppercase tracking-wider">
              Authorized Access ≠ Authorized Behaviour
            </h3>
            <p className="text-xs text-gray-300 mt-0.5">
              The user possesses valid credentials and legitimate IAM permissions, but the sequence, timing, and monetary metrics indicate critical insider misuse.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 bg-[#0b0f17]/80 p-2.5 rounded-lg border border-[#1f293d]">
          {/* Access Box */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[9px] font-bold text-gray-400 uppercase">ACCESS</div>
              <div className="text-xs font-black text-emerald-400">✓ AUTHORIZED</div>
            </div>
          </div>

          <span className="text-gray-500 font-extrabold text-lg">+</span>

          {/* Behaviour Box */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/60 border border-red-500/40 rounded">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <div>
              <div className="text-[9px] font-bold text-gray-400 uppercase">BEHAVIOUR</div>
              <div className="text-xs font-black text-red-400">⚠ DEVIANT / ANOMALOUS</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
