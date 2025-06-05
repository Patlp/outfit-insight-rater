
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useFileValidation } from '@/hooks/useFileValidation';
import { uploadPrimaryTaxonomy, clearPrimaryTaxonomy, getPrimaryTaxonomy } from '@/services/primaryTaxonomyService';
import { useToast } from '@/hooks/use-toast';

const PrimaryTaxonomyUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [taxonomyStats, setTaxonomyStats] = useState<{ count: number } | null>(null);
  
  const { validateFile, parseJSON } = useFileValidation();
  const { toast } = useToast();

  React.useEffect(() => {
    loadTaxonomyStats();
  }, []);

  const loadTaxonomyStats = async () => {
    try {
      const { data, error } = await getPrimaryTaxonomy();
      if (!error && data) {
        setTaxonomyStats({ count: data.length });
      }
    } catch (error) {
      console.warn('Could not load taxonomy stats:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateFile(selectedFile);
    if (validationError) {
      toast({
        title: "File validation failed",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Parse the CSV/JSON file
      const data = await parseJSON(file);
      setUploadProgress(25);

      console.log(`Parsed ${data.length} items from file`);

      // Upload to database
      setUploadProgress(50);
      const result = await uploadPrimaryTaxonomy(data, file.name);
      setUploadProgress(100);

      if (result.success) {
        setUploadResult({
          success: true,
          message: `Successfully uploaded ${result.count} taxonomy items`,
          count: result.count
        });
        
        toast({
          title: "Upload successful",
          description: `Uploaded ${result.count} taxonomy items`,
        });

        // Refresh stats
        await loadTaxonomyStats();
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed'
      });
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClearTaxonomy = async () => {
    if (!window.confirm('Are you sure you want to clear all taxonomy data? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await clearPrimaryTaxonomy();
      
      if (result.success) {
        toast({
          title: "Taxonomy cleared",
          description: "All taxonomy data has been removed",
        });
        await loadTaxonomyStats();
        setUploadResult(null);
      } else {
        throw new Error(result.error || 'Clear operation failed');
      }
    } catch (error) {
      toast({
        title: "Clear failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText size={20} />
          Primary Fashion Taxonomy
        </CardTitle>
        <p className="text-sm text-gray-600">
          Upload CSV/JSON files containing the primary fashion taxonomy data for AI tagging
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {taxonomyStats && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Current taxonomy contains <strong>{taxonomyStats.count}</strong> active items
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="taxonomy-file">Select Taxonomy File (CSV/JSON)</Label>
            <Input
              id="taxonomy-file"
              type="file"
              accept=".csv,.json,.txt"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports CSV, JSON, and TXT formats. Expected fields: item_name, category, style_descriptors, common_materials, etc.
            </p>
          </div>

          {file && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Selected file:</p>
              <p className="text-sm text-gray-600">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Uploading taxonomy data...</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {uploadResult && (
            <Alert variant={uploadResult.success ? "default" : "destructive"}>
              {uploadResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{uploadResult.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex items-center gap-2"
            >
              <Upload size={16} />
              {isUploading ? 'Uploading...' : 'Upload Taxonomy'}
            </Button>

            {taxonomyStats && taxonomyStats.count > 0 && (
              <Button
                variant="destructive"
                onClick={handleClearTaxonomy}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Trash2 size={16} />
                Clear All Data
              </Button>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Expected CSV Format:</strong></p>
          <p>• item_name (required): Name of the clothing item</p>
          <p>• category (required): Main category (shirt, pants, etc.)</p>
          <p>• style_descriptors: Pipe-separated style descriptors (fitted|oversized|casual)</p>
          <p>• common_materials: Pipe-separated materials (cotton|polyester|silk)</p>
          <p>• seasonal_tags, gender_association, etc.: Additional attributes (pipe-separated)</p>
          <p><strong>Note:</strong> Use pipe (|) or semicolon (;) to separate multiple values in array fields</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrimaryTaxonomyUpload;
