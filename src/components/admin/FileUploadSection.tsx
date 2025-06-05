
import React from 'react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface FileUploadSectionProps {
  selectedFile: File | null;
  fileValidationError: string | null;
  isUploading: boolean;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  selectedFile,
  fileValidationError,
  isUploading,
  onFileSelect
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="json-file" className="text-sm font-medium">
        Select Fashionpedia JSON File
      </label>
      <Input
        id="json-file"
        type="file"
        accept="application/json,.json,text/plain,.txt"
        onChange={onFileSelect}
        disabled={isUploading}
        className="cursor-pointer"
      />
      
      {/* Safari/iOS help text */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="text-blue-500" size={16} />
        <AlertDescription className="text-sm">
          <strong>Safari/iPad users:</strong> If you can't select your JSON file, try renaming it with a .txt extension, or use a different browser like Chrome.
        </AlertDescription>
      </Alert>
      
      {selectedFile && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700 font-medium">
            ✓ Selected: {selectedFile.name}
          </p>
          <p className="text-xs text-green-600">
            Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB | Type: {selectedFile.type || 'Unknown'}
          </p>
        </div>
      )}
      
      {fileValidationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700 font-medium">
            ✗ {fileValidationError}
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploadSection;
