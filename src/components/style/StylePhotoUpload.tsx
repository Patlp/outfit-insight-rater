import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Camera, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateFile, compressImage } from '@/utils/imageProcessing';

interface StylePhotoUploadProps {
  onImageSelected: (base64: string) => void;
  selectedImage?: string | null;
  selectedGender: 'male' | 'female';
  onGenderChange: (gender: 'male' | 'female') => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const StylePhotoUpload: React.FC<StylePhotoUploadProps> = ({
  onImageSelected,
  selectedImage,
  selectedGender,
  onGenderChange,
  onAnalyze,
  isAnalyzing
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== UPLOAD PROCESS STARTED ===');
    const file = event.target.files?.[0];
    
    if (!file) {
      console.log('❌ No file selected from input');
      return;
    }

    console.log('✅ File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Reset the input to allow selecting the same file again
    event.target.value = '';

    try {
      console.log('🔍 Starting file validation...');
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('❌ Invalid file type:', file.type);
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        console.error('❌ File too large:', file.size, 'bytes');
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ File validation passed');
      console.log('🔄 Starting image compression...');
      
      setIsCompressing(true);
      
      // Simple compression without external dependency
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const processImage = new Promise<File>((resolve, reject) => {
        img.onload = () => {
          try {
            console.log('🖼️ Original image dimensions:', img.width, 'x', img.height);
            
            // Calculate new dimensions (max 1024px on longest side)
            const maxDimension = 1024;
            let { width, height } = img;
            
            if (width > height && width > maxDimension) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else if (height > maxDimension) {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            console.log('📐 Resized dimensions:', width, 'x', height);
            
            // Draw and compress
            ctx?.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  console.log('✅ Image compressed from', file.size, 'to', blob.size, 'bytes');
                  const compressedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now()
                  });
                  resolve(compressedFile);
                } else {
                  console.error('❌ Failed to create compressed blob');
                  reject(new Error('Failed to compress image'));
                }
              },
              file.type,
              0.8 // 80% quality
            );
          } catch (error) {
            console.error('❌ Error in image processing:', error);
            reject(error);
          }
        };
        
        img.onerror = (error) => {
          console.error('❌ Error loading image:', error);
          reject(new Error('Failed to load image'));
        };
        
        img.src = URL.createObjectURL(file);
      });

      const processedFile = await processImage;
      setIsCompressing(false);
      
      console.log('✅ Image compression completed');
      console.log('📁 Converting to base64...');

      // Convert to base64
      const reader = new FileReader();
      
      const readFile = new Promise<string>((resolve, reject) => {
        reader.onerror = (error) => {
          console.error('❌ FileReader error:', error);
          reject(new Error('Failed to read image file'));
        };

        reader.onload = () => {
          const result = reader.result as string;
          console.log('✅ File read successfully, base64 length:', result.length);
          console.log('📋 Base64 preview:', result.substring(0, 100) + '...');
          resolve(result);
        };

        reader.readAsDataURL(processedFile);
      });

      const base64Result = await readFile;
      
      console.log('🎯 Calling onImageSelected with base64 data...');
      console.log('📊 Before onImageSelected - selectedImage prop exists:', !!selectedImage);
      onImageSelected(base64Result);
      console.log('✅ onImageSelected called successfully');
      
      // Force a small delay to see if state updates
      setTimeout(() => {
        console.log('📊 After onImageSelected (delayed check) - selectedImage prop:', !!selectedImage);
      }, 100);
      
      console.log('✅ Upload process completed successfully!');
      toast({
        title: "Image Uploaded",
        description: "Your photo has been uploaded successfully!",
      });
      
    } catch (error) {
      console.error('❌ Error in upload process:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      
      setIsCompressing(false);
      
      toast({
        title: "Upload Failed", 
        description: error?.message || "Failed to process the image. Please try again.",
        variant: "destructive"
      });
    }
    
    console.log('=== UPLOAD PROCESS ENDED ===');
  };

  const clearImage = () => {
    onImageSelected('');
  };

  return (
    <Card className="fashion-card">
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <div className="border-2 border-dashed border-fashion-300 rounded-lg p-8 hover:border-fashion-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="style-photo-input"
            />
            
            <label htmlFor="style-photo-input" className="cursor-pointer block">
              {isCompressing ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 text-fashion-400 mx-auto animate-spin" />
                  <div>
                    <p className="text-fashion-900 font-medium">Processing image...</p>
                    <p className="text-fashion-600 text-sm">
                      Compressing and optimizing your photo
                    </p>
                  </div>
                </div>
              ) : selectedImage ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img 
                      src={selectedImage} 
                      alt="Uploaded photo" 
                      className="max-h-64 mx-auto rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        clearImage();
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-fashion-600">Click to change image or use the X to remove</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-fashion-400 mx-auto" />
                  <div>
                    <p className="text-fashion-900 font-medium">Upload your photo</p>
                    <p className="text-fashion-600 text-sm">
                      For best results, use a full-body photo with good lighting
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-fashion-800 mb-2 block">
              Gender (for styling principles):
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={selectedGender === 'female' ? 'default' : 'outline'}
                onClick={() => onGenderChange('female')}
                className="flex-1"
              >
                Female
              </Button>
              <Button
                type="button"
                variant={selectedGender === 'male' ? 'default' : 'outline'}
                onClick={() => onGenderChange('male')}
                className="flex-1"
              >
                Male
              </Button>
            </div>
          </div>

          <Button 
            onClick={onAnalyze}
            disabled={!selectedImage || isAnalyzing || isCompressing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Analyze My Style
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-fashion-600 text-center">
          <p>Your image is analyzed securely. We don't store personal photos.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StylePhotoUpload;