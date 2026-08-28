import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { MLAssessment } from '../../types/security';
import { BrainCircuit, CheckCircle2, AlertTriangle, Cpu, Info } from 'lucide-react';
import { formatMLFeatureName, formatSeverity } from '../../utils/formatters';

interface MLAssessmentCardProps {
  mlAssessment?: MLAssessment;
}

export const MLAssessmentCard: React.FC<MLAssessmentCardProps> = ({ mlAssessment }) => {
  if (!mlAssessment || mlAssessment.status === 'unavailable' || mlAssessment.attack_probability === null) {
    return (
      <Card className="h-full border-[#1f293d] bg-[#111827]">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
          <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            Machine Learning Detection Layer (M3)
          </h3>
          <span className="px-2 py-0.5 text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700 rounded font-bold">
            ML OFFLINE
          </span>
        </div>

        <div className="p-4 bg-[#0b0f17] border border-[#1f293d] rounded-xl flex items-start gap-3">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-300 space-y-1">
            <p className="font-semibold text-gray-200">ML Model Not Active</p>
            <p className="text-gray-400 text-[11px]">
              The deterministic behavioural baseline is actively evaluating this event. The ML classifier
              has not been loaded into memory or is disabled.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const prob = mlAssessment.attack_probability;
  const pct = Math.round(prob * 100);
  const isHighOrCritical = pct >= 50;

  return (
    <Card className="h-full border-purple-500/30 bg-[#111827]">
      <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            Machine Learning Detection Layer (M3)
          </h3>
          <p className="text-xs text-gray-400">Statistical classifier inference over 10-D behavioural feature space</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 rounded font-bold">
            {mlAssessment.model_name || 'Random Forest'}
          </span>
          {mlAssessment.severity && (
            <Badge variant="risk" riskLevel={mlAssessment.severity}>
              {formatSeverity(mlAssessment.severity)}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Metric Probability Box */}
      <div className="flex items-center justify-between p-4 bg-[#0b0f17] border border-purple-900/40 rounded-xl mb-4">
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Predicted Malicious Probability
          </div>
          <div className="text-3xl font-black font-mono mt-1 flex items-baseline gap-2">
            <span className={isHighOrCritical ? 'text-red-400' : 'text-emerald-400'}>
              {pct}%
            </span>
            <span className="text-xs text-gray-500 font-normal">
              ({prob.toFixed(4)} prob)
            </span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            {isHighOrCritical ? (
              <AlertTriangle className="w-3 h-3 text-red-400" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            )}
            <span>
              Prediction: {mlAssessment.prediction === 1 ? 'Suspicious / Attack' : 'Normal Baseline Activity'}
            </span>
          </div>
        </div>

        {mlAssessment.confidence !== null && (
          <div className="text-right border-l border-[#1f293d] pl-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Model Confidence</div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5">
              {Math.round(mlAssessment.confidence * 100)}%
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
              v{mlAssessment.model_version || '1.0.0'}
            </div>
          </div>
        )}
      </div>

      {/* Top Contributing Feature Factors */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Active Feature Deviations
          </span>
          <span className="text-gray-500 font-normal text-[11px]">Normalized [0–1]</span>
        </div>

        {mlAssessment.contributing_features && mlAssessment.contributing_features.length > 0 ? (
          <div className="space-y-2">
            {mlAssessment.contributing_features.slice(0, 4).map((f, i) => (
              <div key={i} className="p-2 bg-[#0b0f17] border border-[#1f293d] rounded text-xs space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-sans font-semibold text-gray-200">
                    {formatMLFeatureName(f.feature)}
                  </span>
                  <span className="text-purple-300 font-bold font-mono text-[11px]">
                    {f.value.toFixed(2)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#111827] rounded-full overflow-hidden border border-[#1f293d]/50">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(8, f.value * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-[#0b0f17] border border-[#1f293d] rounded text-xs text-gray-500 text-center">
            All 10 behavioural features match normal user profile baseline.
          </div>
        )}
      </div>
    </Card>
  );
};
