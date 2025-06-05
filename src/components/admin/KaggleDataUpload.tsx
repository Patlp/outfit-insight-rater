
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UploadResult {
  success: boolean;
  processed?: number;
  inserted?: number;
  errors?: number;
  message?: string;
  batchErrors?: string[];
}

const KaggleDataUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
    
    return data;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Read and parse CSV
      const csvText = await selectedFile.text();
      const csvData = parseCSV(csvText);
      
      console.log(`Parsed ${csvData.length} rows from CSV`);
      setUploadProgress(25);

      if (csvData.length === 0) {
        throw new Error('No data found in CSV file');
      }

      // Send to edge function
      setUploadProgress(50);
      const { data, error } = await supabase.functions.invoke('import-kaggle-data', {
        body: {
          csvData: csvData,
          batchSize: 50 // Smaller batches for better progress tracking
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to import data');
      }

      setUploadProgress(100);
      setUploadResult(data);
      
      if (data.success) {
        toast.success(`Successfully imported ${data.inserted} items!`);
      } else {
        toast.error('Import completed with errors');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="text-purple-500" size={24} />
          Kaggle Dataset Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="csv-file" className="text-sm font-medium">
            Select Kaggle Styles CSV File
          </label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          {selectedFile && (
            <p className="text-sm text-gray-600">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <Button 
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Importing Data...
            </>
          ) : (
            <>
              <Database size={16} className="mr-2" />
              Import to Database
            </>
          )}
        </Button>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Upload Progress</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

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
                    {uploadResult.success ? 'Import Successful!' : 'Import Failed'}
                  </p>
                  <p className="text-sm">{uploadResult.message}</p>
                  {uploadResult.success && (
                    <div className="text-sm space-y-1">
                      <p>• Processed: {uploadResult.processed} items</p>
                      <p>• Inserted: {uploadResult.inserted} items</p>
                      {uploadResult.errors && uploadResult.errors > 0 && (
                        <p>• Errors: {uploadResult.errors} items</p>
                      )}
                    </div>
                  )}
                  {uploadResult.batchErrors && uploadResult.batchErrors.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer">Batch Errors ({uploadResult.batchErrors.length})</summary>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {uploadResult.batchErrors.map((error, index) => (
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

export default KaggleDataUpload;
