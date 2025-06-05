
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Brain } from 'lucide-react';
import { useAcademicProcessing } from '@/hooks/useAcademicProcessing';
import ProcessingStats from './processing/ProcessingStats';
import ProcessingControls from './processing/ProcessingControls';
import ProcessingResults from './processing/ProcessingResults';
import ProcessingHistory from './processing/ProcessingHistory';

const AcademicProcessingPanel: React.FC = () => {
  const {
    isProcessing,
    processingProgress,
    processingResult,
    stats,
    pendingPapers,
    totalPapers,
    handleProcessPendingPapers
  } = useAcademicProcessing();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="text-purple-500" size={24} />
          Academic Knowledge Processing
        </CardTitle>
        <p className="text-sm text-gray-600">
          Extract fashion knowledge from academic papers to enhance clothing tagging
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Paper Status Overview */}
        <ProcessingStats 
          totalPapers={totalPapers}
          pendingPapers={pendingPapers}
          totalProcessingRuns={stats?.totalProcessingRuns || 0}
        />

        <Separator />

        {/* Processing Controls */}
        <ProcessingControls
          isProcessing={isProcessing}
          pendingPapers={pendingPapers}
          processingProgress={processingProgress}
          onProcessPapers={handleProcessPendingPapers}
        />

        {/* Processing Results */}
        {processingResult && <ProcessingResults result={processingResult} />}

        {/* Processing History */}
        {stats && <ProcessingHistory stats={stats} />}
      </CardContent>
    </Card>
  );
};

export default AcademicProcessingPanel;
