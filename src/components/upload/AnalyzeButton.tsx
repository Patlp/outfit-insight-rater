
import React from 'react';
import { useRating } from '@/context/RatingContext';
import { useUploadSession } from '@/context/UploadSessionContext';
import { analyzeOutfit } from '@/utils/aiRatingService';
import { toast } from '@/hooks/use-toast';

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
    occasionContext
  } = useRating();
  
  const { setCurrentUpload, setAnalysisResult } = useUploadSession();

  const handleAnalyze = async () => {
    if (!imageFile || !imageSrc) {
      console.error('AnalyzeButton: Missing required data', { hasImageFile: !!imageFile, hasImageSrc: !!imageSrc });
      toast({ description: 'Image data is missing. Please upload an image again.' });
      return;
    }
    
    console.log('AnalyzeButton: Starting analysis', {
      gender: selectedGender,
      feedbackMode,
      imageSrcLength: imageSrc.length,
      occasionContext,
      timestamp: new Date().toISOString()
    });
    
    setIsAnalyzing(true);
    const analysisStartTime = performance.now();
    
    try {
      const result = await analyzeOutfit(
        selectedGender, 
        feedbackMode, 
        imageSrc, 
        occasionContext
      );
      
      const analysisTime = performance.now() - analysisStartTime;
      console.log('AnalyzeButton: Analysis completed successfully', {
        duration: analysisTime.toFixed(2) + 'ms',
        hasResult: !!result,
        score: result?.score
      });
      
      setRatingResult(result);
      
      // Store in upload session context for preservation across signup/payment
      setCurrentUpload({
        imageBase64: imageSrc,
        gender: selectedGender,
        feedbackMode,
        timestamp: Date.now()
      });
      
      setAnalysisResult({
        score: result.score,
        feedback: result.feedback,
        suggestions: result.suggestions || [],
        styleAnalysis: result.styleAnalysis
      });

      // Save to database for authenticated users
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { error: saveError } = await supabase
            .from('wardrobe_items')
            .insert({
              user_id: user.id,
              image_url: imageSrc,
              rating_score: result.score,
              feedback: result.feedback,
              suggestions: result.suggestions || [],
              occasion_context: occasionContext?.eventContext || null,
              gender: selectedGender,
              feedback_mode: feedbackMode,
              extracted_clothing_items: result.styleAnalysis ? JSON.parse(JSON.stringify({ styleAnalysis: result.styleAnalysis })) : null
            });

          if (saveError) {
            console.error('Error saving outfit to database:', saveError);
          } else {
            console.log('Outfit saved to database successfully');
            // Trigger refresh of outfits list
            window.dispatchEvent(new CustomEvent('outfitSaved'));
          }
        }
      } catch (saveError) {
        console.error('Failed to save outfit:', saveError);
      }
      
      toast({ description: 'Analysis complete!' });
    } catch (error) {
      const analysisTime = performance.now() - analysisStartTime;
      console.error('AnalyzeButton: Analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration: analysisTime.toFixed(2) + 'ms'
      });
      toast({ description: 'Failed to analyze your outfit. Please try again.' });
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
