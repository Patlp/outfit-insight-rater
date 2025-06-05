
import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play } from 'lucide-react';

interface ProcessingControlsProps {
  isProcessing: boolean;
  pendingPapers: number;
  processingProgress: number;
  onProcessPapers: () => void;
}

const ProcessingControls: React.FC<ProcessingControlsProps> = ({
  isProcessing,
  pendingPapers,
  processingProgress,
  onProcessPapers
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Knowledge Extraction</h3>
          <p className="text-sm text-gray-600">
            Process academic papers to extract fashion terminology, styling principles, and material properties
          </p>
        </div>
        <Button 
          onClick={onProcessPapers}
          disabled={isProcessing || pendingPapers === 0}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Processing...
            </>
          ) : (
            <>
              <Play size={16} />
              Process {pendingPapers} Papers
            </>
          )}
        </Button>
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing Progress</span>
            <span>{Math.round(processingProgress)}%</span>
          </div>
          <Progress value={processingProgress} className="w-full" />
          <p className="text-xs text-gray-500">
            Extracting fashion terminology, styling principles, and material properties...
          </p>
        </div>
      )}
    </div>
  );
};

export default ProcessingControls;
