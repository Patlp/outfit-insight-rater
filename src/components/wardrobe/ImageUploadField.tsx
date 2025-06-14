
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { validateFile, compressImage } from '@/utils/imageProcessing';
import { uploadCroppedImage } from '@/services/clothing/upload/uploadService';

interface ImageUploadFieldProps {
  currentImageUrl?: string;
  itemName: string;
  wardrobeItemId: string;
  onImageUploaded: (imageUrl: string) => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  currentImageUrl,
  itemName,
  wardrobeItemId,
  onImageUploaded
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) {
      return;
    }

    try {
      setIsUploading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Compress the image
      const compressedFile = await compressImage(file, () => {});

      // Convert to blob
      const blob = new Blob([compressedFile], { type: compressedFile.type });

      // Upload the image
      const uploadedUrl = await uploadCroppedImage(blob, wardrobeItemId, itemName);
      
      onImageUploaded(uploadedUrl);
      toast.success('Image uploaded successfully');

    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearPreview = () => {
    setPreviewUrl(null);
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="space-y-3">
      <Label htmlFor="image-upload">Upload New Photo</Label>
      
      {displayUrl && (
        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={displayUrl}
            alt={`Preview for ${itemName}`}
            className="w-full h-full object-cover"
          />
          {previewUrl && (
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 bg-white/80 p-1 rounded-full hover:bg-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => document.getElementById('image-upload')?.click()}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera size={16} />
              {displayUrl ? 'Change Photo' : 'Add Photo'}
            </>
          )}
        </Button>
      </div>

      <input
        id="image-upload"
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      <p className="text-xs text-gray-500">
        Upload a JPEG or PNG image (max 50MB)
      </p>
    </div>
  );
};

export default ImageUploadField;
