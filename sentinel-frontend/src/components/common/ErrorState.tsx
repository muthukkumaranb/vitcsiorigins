import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Telemetry Error',
  message = 'Unable to retrieve telemetry data.',
  onRetry,
  retryText = 'Retry Connection'
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-[#111827] border border-red-500/20 rounded-xl">
      <div className="p-3 bg-red-500/10 text-red-400 rounded-full mb-4 border border-red-500/30">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h4 className="text-lg font-semibold text-gray-200 mb-2">{title}</h4>
      <p className="text-sm text-gray-400 max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={onRetry}>
          {retryText}
        </Button>
      )}
    </div>
  );
};
