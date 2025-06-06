
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface LocalSyncProgress {
  processed: number;
  total: number;
}

interface SyncStatusBadgeProps {
  connected: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ connected }) => {
  return (
    <div className={`flex items-center px-2 py-0.5 rounded-full text-xs ${
      connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      <span className={`w-2 h-2 mr-1 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
      <span>{connected ? 'Local' : 'Offline'}</span>
    </div>
  );
};

interface ProgressIndicatorProps {
  progress: LocalSyncProgress;
  type: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress, type }) => {
  const percentage = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center text-sm">
          {type === 'Enviando' ? (
            <ArrowUp size={14} className="mr-1 text-blue-500" />
          ) : (
            <ArrowDown size={14} className="mr-1 text-green-500" />
          )}
          <span>{type}</span>
        </div>
        <span className="text-sm font-medium">{`${progress.processed}/${progress.total}`}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};
