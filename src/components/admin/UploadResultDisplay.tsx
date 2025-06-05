
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface UploadResult {
  success: boolean;
  processed?: number;
  inserted?: number;
  errors?: number;
  message?: string;
  errorDetails?: string[];
}

interface UploadResultDisplayProps {
  uploadResult: UploadResult | null;
}

const UploadResultDisplay: React.FC<UploadResultDisplayProps> = ({
  uploadResult
}) => {
  if (!uploadResult) return null;

  return (
    <Alert className={uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
      <div className="flex items-center gap-2">
        {uploadResult.success ? (
          <CheckCircle className="text-green-500" size={16} />
        ) : (
          <AlertCircle className="text-red-500" size={16} />
        )}
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium">
              {uploadResult.success ? 'Import Successful!' : 'Import Failed'}
            </p>
            <p className="text-sm">{uploadResult.message}</p>
            {uploadResult.success && (
              <div className="text-sm space-y-1">
                <p>• Processed: {uploadResult.processed} items</p>
                <p>• Inserted: {uploadResult.inserted} categories</p>
                {uploadResult.errors && uploadResult.errors > 0 && (
                  <p>• Errors: {uploadResult.errors} items</p>
                )}
              </div>
            )}
            {uploadResult.errorDetails && uploadResult.errorDetails.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer">Error Details ({uploadResult.errorDetails.length})</summary>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {uploadResult.errorDetails.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default UploadResultDisplay;
