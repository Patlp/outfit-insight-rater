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
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Reset the input to allow selecting the same file again
    event.target.value = '';

    // Validate file
    if (!validateFile(file)) {
      console.error('File validation failed');
      return;
    }

    try {
      console.log('Starting file processing...');
      
      // Compress image
      const processedFile = await compressImage(file, setIsCompressing);
      console.log('File compression completed');

      // Convert to base64
      const reader = new FileReader();
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        toast({
          title: "Upload Failed",
          description: "Failed to read the image file. Please try again.",
          variant: "destructive"
        });
      };

      reader.onload = () => {
        const result = reader.result as string;
        console.log('File read successfully, base64 length:', result.length);
        
        onImageSelected(result);
        
        toast({
          title: "Image Uploaded",
          description: "Your photo has been uploaded successfully!",
        });
      };

      reader.readAsDataURL(processedFile);
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive"
      });
    }
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