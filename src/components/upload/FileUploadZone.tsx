
import React, { useState } from 'react';
import { Image } from 'lucide-react';
import { validateFile, compressImage } from '@/utils/imageProcessing';
import { toast } from 'sonner';

interface FileUploadZoneProps {
  onFileProcessed: (file: File, imageSrc: string) => void;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onFileProcessed }) => {
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
    if (validateFile(file)) {
      try {
        const processedFile = await compressImage(file, setIsCompressing);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageSrc = e.target?.result as string;
          onFileProcessed(processedFile, imageSrc);
        };
        reader.readAsDataURL(processedFile);
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error('Failed to process image');
      }
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
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
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
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Upload your outfit photo
        </h3>
        
        <p className="text-sm text-gray-500 mb-6">
          {isCompressing 
            ? 'Compressing image...' 
            : ''
          }
        </p>
        
        <input
          type="file"
          id="file-upload"
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={handleChange}
          disabled={isCompressing}
        />
        
        <label htmlFor="file-upload" className={`fashion-button inline-block ${isCompressing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
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
        
        <p className="mt-4 text-xs text-gray-500">
          Max file size: 50MB. Formats: JPG, PNG
          <br />
          Images over 2MB will be automatically compressed
        </p>
      </div>
    </div>
  );
};

export default FileUploadZone;
