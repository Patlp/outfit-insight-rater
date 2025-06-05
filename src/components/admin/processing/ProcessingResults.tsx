
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Target, Layers, Palette, BookOpen } from 'lucide-react';
import { ProcessingResult } from '@/services/academicContentProcessor';

interface ProcessingResultsProps {
  result: ProcessingResult;
}

const ProcessingResults: React.FC<ProcessingResultsProps> = ({ result }) => {
  return (
    <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
      <div className="flex items-center gap-2">
        {result.success ? (
          <CheckCircle className="text-green-500" size={16} />
        ) : (
          <AlertCircle className="text-red-500" size={16} />
        )}
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">
              {result.success ? 'Processing Completed Successfully!' : 'Processing Completed with Errors'}
            </p>
            
            {result.success && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="text-blue-500" size={14} />
                  <span>{result.extractedData.terminology} Terms</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="text-green-500" size={14} />
                  <span>{result.extractedData.principles} Principles</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Palette className="text-orange-500" size={14} />
                  <span>{result.extractedData.materials} Materials</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="text-purple-500" size={14} />
                  <span>{result.processedCount} Papers</span>
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <details className="text-sm mt-2">
                <summary className="cursor-pointer">View Errors ({result.errors.length})</summary>
                <ul className="list-disc list-inside mt-1 space-y-1 text-red-600">
                  {result.errors.slice(0, 10).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li>... and {result.errors.length - 10} more errors</li>
                  )}
                </ul>
              </details>
            )}
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default ProcessingResults;
