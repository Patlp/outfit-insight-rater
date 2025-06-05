
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface UploadProgressDisplayProps {
  isUploading: boolean;
  uploadProgress: number;
}

const UploadProgressDisplay: React.FC<UploadProgressDisplayProps> = ({
  isUploading,
  uploadProgress
}) => {
  if (!isUploading) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Upload Progress</span>
        <span>{uploadProgress}%</span>
      </div>
      <Progress value={uploadProgress} className="w-full" />
    </div>
  );
};

export default UploadProgressDisplay;
