
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Database, FileText, Info } from 'lucide-react';
import { toast } from 'sonner';
import { insertFashionpediaCategory, getFashionpediaCategoriesCount } from '@/services/fashionpediaService';

interface UploadResult {
  success: boolean;
  processed?: number;
  inserted?: number;
  errors?: number;
  message?: string;
  errorDetails?: string[];
}

const FashionpediaDataUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categoriesCount, setCategoriesCount] = useState<number | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);

  React.useEffect(() => {
    loadCategoriesCount();
  }, []);

  const loadCategoriesCount = async () => {
    try {
      const { count, error } = await getFashionpediaCategoriesCount();
      if (!error && count !== null) {
        setCategoriesCount(count);
      }
    } catch (error) {
      console.error('Error loading categories count:', error);
    }
  };

  const validateFile = (file: File): string | null => {
    console.log('Validating file:', { name: file.name, type: file.type, size: file.size });
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
      return 'File must have a .json or .txt extension';
    }
    
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }
    
    // Check if file is empty
    if (file.size === 0) {
      return 'File cannot be empty';
    }
    
    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileValidationError(null);
    setUploadResult(null);
    
    if (!file) {
      setSelectedFile(null);
      return;
    }

    console.log('File selected:', { name: file.name, type: file.type, size: file.size });
    
    const validationError = validateFile(file);
    if (validationError) {
      setFileValidationError(validationError);
      toast.error(validationError);
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
    toast.success('File selected successfully');
  };

  const parseJSON = async (file: File): Promise<any[]> => {
    const text = await file.text();
    console.log('File content preview:', text.substring(0, 200) + '...');
    
    try {
      const data = JSON.parse(text);
      
      if (Array.isArray(data)) {
        return data;
      } else if (data.categories && Array.isArray(data.categories)) {
        return data.categories;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else {
        throw new Error('JSON file should contain an array of categories or have a "categories"/"data" property with an array');
      }
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      console.log('Starting file upload process...');
      const jsonData = await parseJSON(selectedFile);
      console.log(`Parsed ${jsonData.length} categories from JSON`);
      setUploadProgress(25);

      if (jsonData.length === 0) {
        throw new Error('No categories found in JSON file');
      }

      let processed = 0;
      let inserted = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      const batchSize = 10;
      for (let i = 0; i < jsonData.length; i += batchSize) {
        const batch = jsonData.slice(i, i + batchSize);
        
        for (const item of batch) {
          try {
            const category = {
              category_name: item.name || item.category_name || item.category || 'Unknown',
              category_id: item.id || item.category_id,
              description: item.description || item.desc,
              parent_category: item.parent || item.parent_category,
              attributes: {
                ...item.attributes,
                supercategory: item.supercategory,
                level: item.level,
                original_data: item
              }
            };

            const { error } = await insertFashionpediaCategory(category);
            
            if (error) {
              errors++;
              errorDetails.push(`Category "${category.category_name}": ${error.message}`);
              console.error('Insert error:', error);
            } else {
              inserted++;
              console.log(`Inserted category: ${category.category_name}`);
            }
          } catch (error) {
            errors++;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errorDetails.push(`Processing error: ${errorMsg}`);
            console.error('Processing error:', error);
          }
          
          processed++;
        }

        const progress = Math.min(25 + (70 * processed) / jsonData.length, 95);
        setUploadProgress(progress);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setUploadProgress(100);
      
      const result: UploadResult = {
        success: inserted > 0,
        processed,
        inserted,
        errors,
        message: inserted > 0 
          ? `Successfully imported ${inserted} categories${errors > 0 ? ` with ${errors} errors` : ''}!`
          : 'No categories were imported',
        errorDetails: errorDetails.slice(0, 10)
      };
      
      setUploadResult(result);
      
      if (result.success) {
        toast.success(`Successfully imported ${inserted} Fashionpedia categories!`);
        await loadCategoriesCount();
      } else {
        toast.error('Import failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="text-blue-500" size={24} />
          Fashionpedia Dataset Upload
        </CardTitle>
        {categoriesCount !== null && (
          <p className="text-sm text-gray-600">
            Currently {categoriesCount} categories in database
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="json-file" className="text-sm font-medium">
            Select Fashionpedia JSON File
          </label>
          <Input
            id="json-file"
            type="file"
            accept="application/json,.json,text/plain,.txt"
            onChange={handleFileSelect}
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

        <Button 
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || !!fileValidationError}
          className="w-full"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Importing Categories...
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
        )}
      </CardContent>
    </Card>
  );
};

export default FashionpediaDataUpload;
