
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { saveOutfitToWardrobe } from '@/services/wardrobeService';
import { validateFile, compressImage } from '@/utils/imageProcessing';

interface BulkUploadDialogProps {
  onUploadComplete: () => void;
}

interface UploadItem {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

const BulkUploadDialog: React.FC<BulkUploadDialogProps> = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessing, setCurrentProcessing] = useState<number>(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const validFiles = files.filter(file => {
      const isValid = validateFile(file);
      if (!isValid) {
        toast.error(`Invalid file: ${file.name}`);
      }
      return isValid;
    });

    const newItems: UploadItem[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending'
    }));

    setUploadItems(prev => [...prev, ...newItems]);
  };

  const removeItem = (id: string) => {
    setUploadItems(prev => {
      const item = prev.find(item => item.id === id);
      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const processUploads = async () => {
    if (!user?.id || uploadItems.length === 0) return;

    setIsProcessing(true);
    setCurrentProcessing(0);

    for (let i = 0; i < uploadItems.length; i++) {
      const item = uploadItems[i];
      setCurrentProcessing(i + 1);
      
      // Update status to processing
      setUploadItems(prev => prev.map(prevItem => 
        prevItem.id === item.id 
          ? { ...prevItem, status: 'processing' }
          : prevItem
      ));

      try {
        // Compress the image
        const compressedFile = await compressImage(item.file, () => {});
        
        // Create a temporary URL for the compressed file
        const imageUrl = URL.createObjectURL(compressedFile);
        
        // Save to wardrobe with vision tagging - using 'normal' instead of 'bulk-upload'
        const result = await saveOutfitToWardrobe(
          user.id,
          imageUrl,
          0, // No rating for bulk uploads
          '', // No feedback for bulk uploads
          [], // No suggestions for bulk uploads
          'unisex', // Default gender
          'casual', // Default occasion
          'normal', // Use 'normal' instead of 'bulk-upload'
          compressedFile
        );

        if (result.error) {
          throw new Error(result.error);
        }

        // Update status to completed
        setUploadItems(prev => prev.map(prevItem => 
          prevItem.id === item.id 
            ? { ...prevItem, status: 'completed' }
            : prevItem
        ));

        // Clean up the temporary URL
        URL.revokeObjectURL(imageUrl);

      } catch (error) {
        console.error(`Error processing ${item.file.name}:`, error);
        
        // Update status to error
        setUploadItems(prev => prev.map(prevItem => 
          prevItem.id === item.id 
            ? { 
                ...prevItem, 
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : prevItem
        ));
      }
    }

    setIsProcessing(false);
    
    const completedCount = uploadItems.filter(item => item.status === 'completed').length;
    const errorCount = uploadItems.filter(item => item.status === 'error').length;
    
    if (completedCount > 0) {
      toast.success(`Successfully processed ${completedCount} photo${completedCount !== 1 ? 's' : ''}`);
      onUploadComplete();
    }
    
    if (errorCount > 0) {
      toast.error(`Failed to process ${errorCount} photo${errorCount !== 1 ? 's' : ''}`);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    
    // Clean up preview URLs
    uploadItems.forEach(item => {
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
    });
    
    setUploadItems([]);
    setIsOpen(false);
    setCurrentProcessing(0);
  };

  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'pending':
        return <Upload className="w-4 h-4 text-gray-400" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-fashion-500 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const progress = uploadItems.length > 0 ? (currentProcessing / uploadItems.length) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Upload size={16} />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Upload Photos</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="hidden"
              id="bulk-file-input"
            />
            <label htmlFor="bulk-file-input" className="cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Click to select multiple photos (JPG, PNG)
              </p>
            </label>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing photos...</span>
                <span>{currentProcessing} of {uploadItems.length}</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Upload Items List */}
          {uploadItems.length > 0 && (
            <div className="flex-1 overflow-y-auto space-y-2 max-h-60">
              {uploadItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 border rounded">
                  <img
                    src={item.preview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(item.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    {item.error && (
                      <p className="text-xs text-red-500 truncate">{item.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    {!isProcessing && item.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Cancel'}
            </Button>
            <Button
              onClick={processUploads}
              disabled={uploadItems.length === 0 || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload {uploadItems.length} Photo{uploadItems.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadDialog;
