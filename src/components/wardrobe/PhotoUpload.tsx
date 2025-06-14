
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Image } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { uploadOutfitPhoto } from '@/services/outfitInspiration';

interface PhotoUploadProps {
  onUploadComplete: () => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleUpload = async () => {
    if (!user?.id) {
      toast.error('Please sign in to upload photos');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a photo to upload');
      return;
    }

    setIsUploading(true);

    try {
      console.log('🔄 Starting photo upload:', selectedFile.name);
      
      const result = await uploadOutfitPhoto({
        userId: user.id,
        file: selectedFile,
        title: `Outfit inspiration - ${new Date().toLocaleDateString()}`
      });

      if (result.error) {
        console.error('❌ Photo upload failed:', result.error);
        toast.error(`Upload failed: ${result.error}`);
      } else {
        console.log('✅ Photo upload successful:', result);
        toast.success('Photo uploaded successfully!');
        setSelectedFile(null);
        setPreviewUrl(null);
        onUploadComplete();
      }
    } catch (error) {
      console.error('❌ Photo upload error:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-fashion-500 bg-fashion-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop your outfit photo here
          </p>
          <p className="text-gray-500 mb-4">
            or click to browse your files
          </p>
          <Label htmlFor="file-upload">
            <Button variant="outline" className="cursor-pointer">
              Choose File
            </Button>
          </Label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-xs text-gray-400 mt-2">
            Supports JPG, PNG, WEBP (max 10MB)
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={previewUrl || ''}
              alt="Preview"
              className="w-full max-h-64 object-contain rounded-lg border"
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={clearSelection}
              className="absolute top-2 right-2"
            >
              Remove
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearSelection}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
