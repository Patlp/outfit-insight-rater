
import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Image } from 'lucide-react';
import { validateFile, compressImage } from '@/utils/imageProcessing';
import { toast } from 'sonner';

interface CombinedUploadFormProps {
  onFileProcessed: (file: File, imageSrc: string, occasionData: { eventContext: string | null; isNeutral: boolean }) => void;
}

const CombinedUploadForm: React.FC<CombinedUploadFormProps> = ({ onFileProcessed }) => {
  const [eventContext, setEventContext] = useState('');
  const [isNeutral, setIsNeutral] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFile = async (file: File) => {
    console.log('Starting file processing:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      timestamp: new Date().toISOString()
    });

    if (!validateFile(file)) {
      console.error('File validation failed');
      return;
    }
    
    try {
      const processedFile = await compressImage(file, setIsCompressing);
      console.log('Image compression completed, starting file read');
      
      const reader = new FileReader();
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        toast.error('Failed to read image file. Please try again.');
      };
      
      reader.onabort = () => {
        console.error('FileReader aborted');
        toast.error('Image reading was interrupted. Please try again.');
      };
      
      reader.onload = (e) => {
        try {
          console.log('FileReader completed successfully');
          const imageSrc = e.target?.result as string;
          
          if (!imageSrc) {
            throw new Error('Failed to read image data');
          }
          
          const occasionData = {
            eventContext: isNeutral ? null : eventContext.trim(),
            isNeutral
          };
          
          console.log('Calling onFileProcessed with:', {
            fileSize: processedFile.size,
            imageSrcLength: imageSrc.length,
            occasionData
          });
          
          onFileProcessed(processedFile, imageSrc, occasionData);
        } catch (error) {
          console.error('Error in FileReader onload:', error);
          toast.error('Failed to process image. Please try again.');
        }
      };
      
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error('Failed to process file:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        fileName: file.name,
        fileSize: file.size
      });
      toast.error('Failed to process image. Please try again.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('File input change event triggered');
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    
    // Clear the input value to allow selecting the same file again
    e.target.value = '';
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-6">
        {/* Occasion Context Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Tell us about your outfit
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="occasion-input" className="block text-sm font-medium text-gray-700 mb-2">
                What's the occasion or vibe for this outfit?
              </label>
              <Textarea
                id="occasion-input"
                value={eventContext}
                onChange={(e) => setEventContext(e.target.value)}
                disabled={isNeutral}
                placeholder="e.g. 'Splash City – Afrobeats festival in London', 'First date', 'Streetwear shoot', 'Summer wedding', 'Work meeting'"
                className={`min-h-[80px] resize-none ${
                  isNeutral ? 'bg-gray-50 text-gray-400' : ''
                }`}
              />
              {!isNeutral && eventContext.trim().length > 0 && eventContext.trim().length < 5 && (
                <p className="text-sm text-red-500 mt-1">
                  Please enter at least 5 characters
                </p>
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="neutral-toggle" className="text-sm font-medium text-gray-700">
                  Just trying outfits – No specific occasion
                </label>
                <p className="text-xs text-gray-500">
                  Get general style feedback instead
                </p>
              </div>
              <Switch
                id="neutral-toggle"
                checked={isNeutral}
                onCheckedChange={setIsNeutral}
              />
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div>
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
              dragActive 
                ? 'border-fashion-400 bg-fashion-100' 
                : 'border-gray-300 hover:border-fashion-300 bg-white'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              Upload your outfit photo
            </h4>
            
            <p className="text-sm text-gray-500 mb-6">
              {isCompressing 
                ? 'Compressing image...' 
                : ''
              }
            </p>
            
            <div>
              <input
                type="file"
                id="file-upload"
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
                onChange={handleChange}
                disabled={isCompressing}
                onClick={(e) => {
                  e.stopPropagation();
                  // Reset input value to allow same file selection
                  (e.target as HTMLInputElement).value = '';
                }}
              />
              
              <label 
                htmlFor="file-upload" 
                className={`fashion-button inline-block ${isCompressing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="flex items-center gap-2">
                  {isCompressing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    <>
                      <Image className="h-5 w-5" />
                      Upload or Take Photo
                    </>
                  )}
                </span>
              </label>
            </div>
            
            <p className="mt-4 text-xs text-gray-500">
              Max file size: 50MB. Formats: JPG, PNG
              <br />
              Images over 2MB will be automatically compressed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedUploadForm;
