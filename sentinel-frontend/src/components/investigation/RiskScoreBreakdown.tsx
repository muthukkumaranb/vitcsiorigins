import React from 'react';
import { Card } from '../common/Card';
import { RiskAssessment } from '../../types/security';
import { ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

interface RiskScoreBreakdownProps {
  risk: RiskAssessment;
}

export const RiskScoreBreakdown: React.FC<RiskScoreBreakdownProps> = ({ risk }) => {

  return (
    <Card className="h-full border-red-500/30 bg-gradient-to-b from-[#111827] to-[#161f30]">
      <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
        <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          Explainable Risk Decomposition (USP 6)
        </h3>
        <span className="text-[10px] text-gray-400 font-mono">ISOLATION FOREST v1.0</span>
      </div>

      {/* Main Score Visual */}
      <div className="flex items-center justify-between p-4 bg-[#0b0f17] border border-red-500/40 rounded-xl mb-5">
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Risk Score</div>
          <div className="text-4xl font-black font-mono text-red-500 mt-1">
            {risk.risk_score}
            <span className="text-sm text-gray-500 font-normal"> / 100</span>
          </div>
          <div className="text-xs font-bold text-red-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>LEVEL: {risk.risk_level}</span>
          </div>
        </div>

        {/* Secondary Trust Score Box */}
        <div className="text-right border-l border-[#1f293d] pl-5">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Behavioural Trust</div>
          <div className="text-3xl font-black font-mono text-cyan-400 mt-1">
            {risk.trust_score}
            <span className="text-xs text-gray-500 font-normal"> / 100</span>
          </div>
          <div className="text-[11px] text-amber-400 font-semibold mt-1">DEGRADED BASELINE</div>
        </div>
      </div>

      {/* Risk Factors Breakdown Bars */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
          <span>Risk Contributors ("WHY IS IT RISKY?")</span>
          <span className="text-gray-500 font-normal">Points Added</span>
        </div>

        {risk.risk_factors.map((factor, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-200">{factor.name}</span>
              <span className="font-mono font-bold text-red-400">+{factor.score} pts</span>
            </div>
            <div className="w-full h-2 bg-[#0b0f17] rounded-full overflow-hidden border border-[#1f293d]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(factor.score / 30) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
              />
            </div>
            <p className="text-[10px] text-gray-400">{factor.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
