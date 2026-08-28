import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useAnalystFeedbackMutation } from '../../hooks/useSecurityData';
import { CheckCircle, AlertTriangle, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

interface AnalystFeedbackModalProps {
  userId: string;
}

export const AnalystFeedbackModal: React.FC<AnalystFeedbackModalProps> = ({ userId }) => {
  const [decision, setDecision] = useState<'CONFIRMED_THREAT' | 'FALSE_POSITIVE'>('CONFIRMED_THREAT');
  const [comment, setComment] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const feedbackMutation = useAnalystFeedbackMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    feedbackMutation.mutate(
      {
        incident_id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        user_id: userId,
        decision,
        comment: comment || 'Unauthorized beneficiary modification & sequence anomaly confirmed.',
        timestamp: new Date().toISOString(),
        analyst: 'SOC Lead Analyst'
      },
      {
        onSuccess: (data) => {
          setSubmittedMessage(data.message);
          setTimeout(() => setSubmittedMessage(null), 5000);
        }
      }
    );
  };

  return (
    <Card className="h-full border-cyan-500/30">
      <div className="flex items-center justify-between pb-3 border-b border-[#1f293d] mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            Continuous Learning Feedback Loop (USP 8)
          </h3>
          <p className="text-xs text-gray-400">Analyst investigation decision for model tuning</p>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 border border-cyan-800 bg-cyan-950/60 px-2 py-0.5 rounded">
          ML FEEDBACK
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
            Investigation Outcome Decision
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision('CONFIRMED_THREAT')}
              className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                decision === 'CONFIRMED_THREAT'
                  ? 'bg-red-950 border-red-500 text-red-300 ring-2 ring-red-500/30'
                  : 'bg-[#0b0f17] border-[#1f293d] text-gray-400 hover:text-gray-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              CONFIRMED THREAT
            </button>

            <button
              type="button"
              onClick={() => setDecision('FALSE_POSITIVE')}
              className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                decision === 'FALSE_POSITIVE'
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                  : 'bg-[#0b0f17] border-[#1f293d] text-gray-400 hover:text-gray-200'
              }`}
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              FALSE POSITIVE
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Analyst Notes</label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Record technical context (e.g., Confirmed malicious transfer to offshore unverified account)..."
            className="w-full p-2.5 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={feedbackMutation.isPending}
          icon={<Send className="w-3.5 h-3.5" />}
          className="w-full"
        >
          {feedbackMutation.isPending ? 'Submitting Feedback...' : 'SUBMIT ANALYST DECISION'}
        </Button>
      </form>

      {submittedMessage && (
        <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 rounded text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{submittedMessage}</span>
        </div>
      )}
    </Card>
  );
};
