
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { checkGenerationProgress } from '@/services/wardrobe/aiImageIntegration';

interface GenerationProgressIndicatorProps {
  wardrobeItemId: string;
  onComplete?: () => void;
}

const GenerationProgressIndicator: React.FC<GenerationProgressIndicatorProps> = ({
  wardrobeItemId,
  onComplete
}) => {
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    failed: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkProgress = async () => {
      try {
        const progressData = await checkGenerationProgress(wardrobeItemId);
        setProgress(progressData);
        
        // Show indicator if there's any activity
        if (progressData.total > 0 && progressData.inProgress > 0) {
          setIsVisible(true);
        }
        
        // Hide indicator and call onComplete when all items are processed
        if (progressData.total > 0 && progressData.inProgress === 0) {
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
          }, 2000); // Show final state for 2 seconds
        }
      } catch (error) {
        console.error('❌ Error checking generation progress:', error);
      }
    };

    // Check immediately
    checkProgress();

    // Then check every 3 seconds
    intervalId = setInterval(checkProgress, 3000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [wardrobeItemId, onComplete]);

  if (!isVisible || progress.total === 0) {
    return null;
  }

  const progressPercentage = (progress.completed / progress.total) * 100;
  const isComplete = progress.inProgress === 0;

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle size={16} className="text-green-600" />
          ) : (
            <Loader2 size={16} className="text-blue-600 animate-spin" />
          )}
          <span className="text-sm font-medium">
            {isComplete ? 'AI Image Generation Complete' : 'Generating Professional Images...'}
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          TheNewBlack AI
        </Badge>
      </div>

      <Progress value={progressPercentage} className="h-2" />

      <div className="flex justify-between items-center text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <CheckCircle size={12} className="text-green-600" />
            <span>{progress.completed} completed</span>
          </div>
          {progress.inProgress > 0 && (
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-blue-600" />
              <span>{progress.inProgress} in progress</span>
            </div>
          )}
          {progress.failed > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle size={12} className="text-red-600" />
              <span>{progress.failed} failed</span>
            </div>
          )}
        </div>
        <span>{progress.completed}/{progress.total}</span>
      </div>
    </div>
  );
};

export default GenerationProgressIndicator;
