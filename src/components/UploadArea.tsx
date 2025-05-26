
import React, { useState } from 'react';
import { useRating } from '@/context/RatingContext';
import { Image, X, Flame } from 'lucide-react';
import { analyzeOutfit } from '@/utils/aiRatingService';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

const UploadArea: React.FC = () => {
  const {
    selectedGender,
    feedbackMode,
    setFeedbackMode,
    imageFile,
    setImageFile,
    imageSrc,
    setImageSrc,
    isAnalyzing,
    setIsAnalyzing,
    setRatingResult,
    resetState,
    hasUnlockedRoastMode,
    setShowInviteWall
  } = useRating();
  
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

  const validateFile = (file: File): boolean => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG or PNG image');
      return false;
    }
    
    // Check file size (50MB max as fallback)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      toast.error('Image size should be less than 50MB');
      return false;
    }
    
    return true;
  };

  const compressImage = async (file: File): Promise<File> => {
    try {
      setIsCompressing(true);
      
      // Only compress if file is larger than 2MB
      if (file.size <= 2 * 1024 * 1024) {
        console.log('File is already small enough, skipping compression');
        return file;
      }

      console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      const options = {
        maxSizeMB: 4.5, // Target size slightly under 5MB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
        initialQuality: 0.8,
      };

      const compressedFile = await imageCompression(file, options);
      console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      toast.success(`Image compressed from ${(file.size / 1024 / 1024).toFixed(1)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB`);
      return compressedFile;
    } catch (error) {
      console.error('Compression failed:', error);
      toast.warning('Image compression failed, using original file');
      return file; // Return original file if compression fails
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFile = async (file: File) => {
    if (validateFile(file)) {
      try {
        const processedFile = await compressImage(file);
        setImageFile(processedFile);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageSrc(e.target?.result as string);
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

  const handleReset = () => {
    resetState();
  };

  const toggleRoastMode = () => {
    if (!hasUnlockedRoastMode && feedbackMode === 'normal') {
      // Show the invite wall if roast mode is not unlocked
      setShowInviteWall(true);
      return;
    }
    
    // Toggle the mode if already unlocked
    setFeedbackMode(feedbackMode === 'normal' ? 'roast' : 'normal');
  };

  const handleAnalyze = async () => {
    if (!imageFile || !imageSrc) return;
    
    setIsAnalyzing(true);
    try {
      // We already have the base64 image in imageSrc
      const result = await analyzeOutfit(selectedGender, feedbackMode, imageSrc);
      setRatingResult(result);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze your outfit. Please try again.');
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
        
        {/* Roast Mode Toggle */}
        <div className="mb-6">
          <button
            onClick={toggleRoastMode}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg w-full 
              ${feedbackMode === 'roast' 
                ? 'bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-600' 
                : 'bg-white hover:bg-gray-100 text-gray-800 border-2 border-gray-300'
              } 
              transition-all duration-300`}
          >
            <Flame className={`h-5 w-5 ${feedbackMode === 'roast' ? 'text-white' : 'text-orange-500'}`} />
            <span className="font-medium">
              {feedbackMode === 'roast' ? 'Roast Mode: ON' : 'Roast Mode: OFF'}
            </span>
          </button>
          {feedbackMode === 'roast' && (
            <p className="text-sm text-orange-600 mt-2 text-center">
              Warning: Prepare for brutally honest, possibly offensive feedback!
            </p>
          )}
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
            <span>{feedbackMode === 'roast' ? 'Roast My Outfit' : 'Rate My Outfit'}</span>
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

export default UploadArea;
