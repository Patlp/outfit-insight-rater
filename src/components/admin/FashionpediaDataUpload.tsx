
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { insertFashionpediaCategory, getFashionpediaCategoriesCount } from '@/services/fashionpediaService';
import { useFileValidation } from '@/hooks/useFileValidation';
import FileUploadSection from './FileUploadSection';
import UploadProgressDisplay from './UploadProgressDisplay';
import UploadResultDisplay from './UploadResultDisplay';

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

  const { validateFile, parseJSON } = useFileValidation();

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
        <FileUploadSection
          selectedFile={selectedFile}
          fileValidationError={fileValidationError}
          isUploading={isUploading}
          onFileSelect={handleFileSelect}
        />

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

        <UploadProgressDisplay
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />

        <UploadResultDisplay uploadResult={uploadResult} />
      </CardContent>
    </Card>
  );
};

export default FashionpediaDataUpload;
