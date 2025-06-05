
import React from 'react';
import { useRating } from '@/context/RatingContext';
import { analyzeOutfit } from '@/utils/aiRatingService';
import { toast } from 'sonner';

interface AnalyzeButtonProps {
  imageFile: File | null;
  imageSrc: string | null;
}

const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({ imageFile, imageSrc }) => {
  const {
    selectedGender,
    feedbackMode,
    isAnalyzing,
    setIsAnalyzing,
    setRatingResult,
    setUploadedImage,
    occasionContext
  } = useRating();

  const handleAnalyze = async () => {
    if (!imageFile || !imageSrc) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeOutfit(
        selectedGender, 
        feedbackMode, 
        imageSrc, 
        occasionContext
      );
      setRatingResult(result);
      // Set the uploaded image URL so SaveOutfitButton can access it
      setUploadedImage(imageSrc);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze your outfit. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
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
  );
};

export default AnalyzeButton;
