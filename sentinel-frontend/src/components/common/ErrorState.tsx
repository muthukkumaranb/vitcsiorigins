import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Unable to retrieve threat intelligence or telemetry data.',
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-[#111827] border border-red-500/20 rounded-xl">
      <div className="p-3 bg-red-500/10 text-red-400 rounded-full mb-4 border border-red-500/30">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h4 className="text-lg font-semibold text-gray-200 mb-2">Telemetry Error</h4>
      <p className="text-sm text-gray-400 max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={onRetry}>
          Retry Connection
        </Button>
      )}
    </div>
  );
};
