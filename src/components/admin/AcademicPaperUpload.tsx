
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, BookOpen, Info, Upload, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { insertAcademicPaper, getAcademicPapersCount, type AcademicPaper } from '@/services/academicPaperService';
import UploadProgressDisplay from './UploadProgressDisplay';

interface UploadResult {
  success: boolean;
  message?: string;
  processed?: number;
  inserted?: number;
  errors?: number;
  errorDetails?: string[];
}

const AcademicPaperUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [papersCount, setPapersCount] = useState<number | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);

  useEffect(() => {
    loadPapersCount();
  }, []);

  const loadPapersCount = async () => {
    try {
      const { count, error } = await getAcademicPapersCount();
      if (!error && count !== null) {
        setPapersCount(count);
      }
    } catch (error) {
      console.error('Error loading papers count:', error);
    }
  };

  const validateFiles = (files: File[]): string | null => {
    for (const file of files) {
      console.log('Validating file:', { name: file.name, type: file.type, size: file.size });
      
      // Check file extension
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.pdf')) {
        return `File "${file.name}" must be a PDF`;
      }
      
      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        return `File "${file.name}" size must be less than 50MB`;
      }
      
      // Check if file is empty
      if (file.size === 0) {
        return `File "${file.name}" cannot be empty`;
      }
    }
    
    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFileValidationError(null);
    setUploadResult(null);
    
    if (files.length === 0) {
      setSelectedFiles([]);
      return;
    }

    console.log('Files selected:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    const validationError = validateFiles(files);
    if (validationError) {
      setFileValidationError(validationError);
      toast.error(validationError);
      setSelectedFiles([]);
      return;
    }
    
    setSelectedFiles(files);
    toast.success(`${files.length} PDF${files.length > 1 ? 's' : ''} selected successfully`);
  };

  const extractTitleFromFilename = (filename: string): string => {
    // Remove file extension and clean up the filename
    return filename
      .replace(/\.pdf$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .trim();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one PDF file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      console.log('Starting bulk paper upload process...');
      setUploadProgress(10);

      let processed = 0;
      let inserted = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        processed++;
        
        try {
          const title = extractTitleFromFilename(file.name);
          
          const paperData: AcademicPaper = {
            title,
            processing_status: 'pending',
            metadata: {
              original_filename: file.name,
              file_size: file.size,
              upload_timestamp: new Date().toISOString(),
              bulk_upload: true
            }
          };

          const { data, error } = await insertAcademicPaper(paperData);
          
          if (error) {
            throw new Error(`Failed to save paper: ${error.message}`);
          }

          inserted++;
          console.log(`Successfully uploaded: ${title}`);
          
        } catch (error) {
          errors++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errorDetails.push(`${file.name}: ${errorMsg}`);
          console.error(`Error uploading ${file.name}:`, error);
        }

        // Update progress
        const progress = Math.round(((i + 1) / selectedFiles.length) * 90) + 10;
        setUploadProgress(progress);
      }

      setUploadProgress(100);
      
      const result: UploadResult = {
        success: errors < selectedFiles.length,
        message: `Bulk upload completed: ${inserted} papers uploaded successfully${errors > 0 ? `, ${errors} failed` : ''}`,
        processed,
        inserted,
        errors: errors > 0 ? errors : undefined,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined
      };
      
      setUploadResult(result);
      
      if (result.success) {
        toast.success(`Successfully uploaded ${inserted} academic papers!`);
        await loadPapersCount();
        resetForm();
      } else {
        toast.error(`Upload completed with ${errors} errors`);
      }

    } catch (error) {
      console.error('Bulk upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setUploadResult({
        success: false,
        message: errorMsg
      });
      toast.error('Upload failed: ' + errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setUploadResult(null);
    setFileValidationError(null);
    // Reset file input
    const fileInput = document.getElementById('pdf-files') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="text-blue-500" size={24} />
          Academic Paper Upload
        </CardTitle>
        {papersCount !== null && (
          <p className="text-sm text-gray-600">
            Currently {papersCount} papers in database
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="text-blue-500" size={16} />
          <AlertDescription className="text-sm">
            Upload PDF academic papers about fashion to improve AI categorization and insights. 
            You can select multiple files for bulk upload. Paper titles will be automatically extracted from filenames.
            After uploading, use the Academic Processing panel to extract fashion knowledge.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label htmlFor="pdf-files" className="text-sm font-medium">
            Select PDF Files
          </label>
          <Input
            id="pdf-files"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading}
            className="cursor-pointer"
          />
          
          {selectedFiles.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700 font-medium">
                ✓ Selected: {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
              </p>
              <div className="text-xs text-green-600 space-y-1 mt-2">
                {selectedFiles.map((file, index) => (
                  <div key={index}>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ))}
              </div>
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

        <Button 
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading || !!fileValidationError}
          className="w-full"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Uploading {selectedFiles.length} Papers...
            </>
          ) : (
            <>
              <Upload size={16} className="mr-2" />
              Upload {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}Academic Paper{selectedFiles.length > 1 ? 's' : ''}
            </>
          )}
        </Button>

        <UploadProgressDisplay isUploading={isUploading} uploadProgress={uploadProgress} />

        {uploadResult && (
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
                    {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                  </p>
                  <p className="text-sm">{uploadResult.message}</p>
                  {uploadResult.success && (
                    <div className="text-sm space-y-1">
                      <p>• Processed: {uploadResult.processed} files</p>
                      <p>• Inserted: {uploadResult.inserted} papers</p>
                      {uploadResult.errors && uploadResult.errors > 0 && (
                        <p>• Errors: {uploadResult.errors} files</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded">
                        <Brain className="text-blue-500" size={14} />
                        <span className="text-xs text-blue-700">
                          Next: Process papers to extract fashion knowledge using the Academic Processing panel
                        </span>
                      </div>
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
        )}
      </CardContent>
    </Card>
  );
};

export default AcademicPaperUpload;
