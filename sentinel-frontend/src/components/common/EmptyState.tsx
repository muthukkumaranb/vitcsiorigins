import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Telemetry Signals Found',
  description = 'There are no active anomalies or recorded security events matching the selected filter criteria.'
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-[#111827] border border-[#1f293d] rounded-xl">
      <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full mb-4 border border-emerald-500/30">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <h4 className="text-lg font-semibold text-gray-200 mb-2">{title}</h4>
      <p className="text-sm text-gray-400 max-w-md">{description}</p>
    </div>
  );
};
