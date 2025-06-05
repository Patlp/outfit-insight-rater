
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, FileText, BookOpen, Info, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { insertAcademicPaper, getAcademicPapersCount, type AcademicPaper } from '@/services/academicPaperService';

interface UploadResult {
  success: boolean;
  message?: string;
  paperId?: string;
}

const AcademicPaperUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [papersCount, setPapersCount] = useState<number | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [abstract, setAbstract] = useState('');
  const [journal, setJournal] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [doi, setDoi] = useState('');
  const [keywords, setKeywords] = useState('');

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

  const validateFile = (file: File): string | null => {
    console.log('Validating file:', { name: file.name, type: file.type, size: file.size });
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      return 'File must be a PDF';
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
    toast.success('PDF selected successfully');
  };

  const resetForm = () => {
    setTitle('');
    setAuthors('');
    setAbstract('');
    setJournal('');
    setPublicationYear('');
    setDoi('');
    setKeywords('');
    setSelectedFile(null);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      console.log('Starting paper upload process...');
      setUploadProgress(25);

      // Parse authors and keywords
      const authorsArray = authors.split(',').map(a => a.trim()).filter(a => a.length > 0);
      const keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);

      const paperData: AcademicPaper = {
        title: title.trim(),
        authors: authorsArray.length > 0 ? authorsArray : undefined,
        abstract: abstract.trim() || undefined,
        journal: journal.trim() || undefined,
        publication_year: publicationYear ? parseInt(publicationYear) : undefined,
        doi: doi.trim() || undefined,
        keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
        processing_status: 'pending',
        metadata: {
          original_filename: selectedFile?.name,
          file_size: selectedFile?.size,
          upload_timestamp: new Date().toISOString()
        }
      };

      setUploadProgress(75);

      const { data, error } = await insertAcademicPaper(paperData);
      
      if (error) {
        throw new Error(`Failed to save paper: ${error.message}`);
      }

      setUploadProgress(100);
      
      const result: UploadResult = {
        success: true,
        message: `Successfully uploaded academic paper: "${title}"`,
        paperId: data.id
      };
      
      setUploadResult(result);
      toast.success('Academic paper uploaded successfully!');
      await loadPapersCount();
      resetForm();

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
            Upload academic papers about fashion to improve AI categorization and insights. The system will process the content and extract relevant fashion knowledge.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Paper title"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authors">Authors</Label>
            <Input
              id="authors"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="Author 1, Author 2, Author 3"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="journal">Journal</Label>
            <Input
              id="journal"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="Journal name"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Publication Year</Label>
            <Input
              id="year"
              type="number"
              value={publicationYear}
              onChange={(e) => setPublicationYear(e.target.value)}
              placeholder="2024"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doi">DOI</Label>
            <Input
              id="doi"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="10.1000/182"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="fashion, style, color theory"
              disabled={isUploading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="abstract">Abstract</Label>
          <Textarea
            id="abstract"
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            placeholder="Paper abstract (optional)"
            rows={4}
            disabled={isUploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pdf-file">PDF File</Label>
          <Input
            id="pdf-file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="cursor-pointer"
          />
          
          {selectedFile && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700 font-medium">
                ✓ Selected: {selectedFile.name}
              </p>
              <p className="text-xs text-green-600">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
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
          disabled={!title.trim() || isUploading || !!fileValidationError}
          className="w-full"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Uploading Paper...
            </>
          ) : (
            <>
              <Upload size={16} className="mr-2" />
              Upload Academic Paper
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
                    {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                  </p>
                  <p className="text-sm">{uploadResult.message}</p>
                  {uploadResult.success && (
                    <p className="text-sm">
                      Paper ID: {uploadResult.paperId}
                    </p>
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
