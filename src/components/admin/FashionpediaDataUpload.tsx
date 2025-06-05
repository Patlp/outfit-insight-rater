
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Database, FileText } from 'lucide-react';
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.json')) {
        toast.error('Please select a JSON file');
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const parseJSON = async (file: File): Promise<any[]> => {
    const text = await file.text();
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
            accept=".json"
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
