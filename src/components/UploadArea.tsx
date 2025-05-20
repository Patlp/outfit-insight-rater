
import React, { useState } from 'react';
import { useRating } from '@/context/RatingContext';
import { Upload, Image, X } from 'lucide-react';
import { analyzeOutfit } from '@/utils/mockRatingService';
import { toast } from 'sonner';

const UploadArea: React.FC = () => {
  const {
    selectedGender,
    imageFile,
    setImageFile,
    imageSrc,
    setImageSrc,
    isAnalyzing,
    setIsAnalyzing,
    setRatingResult,
    resetState
  } = useRating();
  
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG or PNG image');
      return false;
    }
    
    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB');
      return false;
    }
    
    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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

  const handleReset = () => {
    resetState();
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeOutfit(selectedGender);
      setRatingResult(result);
    } catch (error) {
      toast.error('Failed to analyze your outfit. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (imageSrc) {
    return (
      <div className="max-w-md w-full mx-auto">
        <div className="mb-4 relative rounded-2xl overflow-hidden shadow-lg">
          <img 
            src={imageSrc} 
            alt="Outfit preview" 
            className="w-full h-auto object-cover"
          />
          <button 
            onClick={handleReset}
            className="absolute top-3 right-3 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors"
          >
            <X size={18} className="text-gray-700" />
          </button>
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={`fashion-button w-full flex items-center justify-center gap-2 ${
            isAnalyzing ? 'opacity-70 cursor-wait' : ''
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Analyzing outfit...</span>
            </>
          ) : (
            <span>Rate My Outfit</span>
          )}
        </button>
      </div>
    );
  }

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
        <div className="fashion-gradient w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="h-8 w-8 text-white" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Upload your outfit photo
        </h3>
        
        <p className="text-sm text-gray-500 mb-6">
          Drag and drop an image, or click to browse
        </p>
        
        <input
          type="file"
          id="file-upload"
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={handleChange}
        />
        
        <label htmlFor="file-upload" className="fashion-button inline-block cursor-pointer">
          <span className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Choose Image
          </span>
        </label>
        
        <p className="mt-4 text-xs text-gray-500">
          Max file size: 5MB. Formats: JPG, PNG
        </p>
      </div>
    </div>
  );
};

export default UploadArea;
