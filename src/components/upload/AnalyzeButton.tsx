
import React from 'react';
import { useRating } from '@/context/RatingContext';
import { useUploadSession } from '@/context/UploadSessionContext';
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
    occasionContext
  } = useRating();
  
  const { setCurrentUpload, setAnalysisResult } = useUploadSession();

  const handleAnalyze = async () => {
    if (!imageFile || !imageSrc) {
      console.error('AnalyzeButton: Missing required data', { hasImageFile: !!imageFile, hasImageSrc: !!imageSrc });
      toast.error('Image data is missing. Please upload an image again.');
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
      // Ensure we have valid base64 data
      let imageBase64 = imageSrc;
      
      // If it's a data URL, extract just the base64 part
      if (imageSrc.startsWith('data:')) {
        const base64Start = imageSrc.indexOf(',') + 1;
        imageBase64 = imageSrc.substring(base64Start);
      }
      
      console.log('AnalyzeButton: Image data prepared', {
        originalLength: imageSrc.length,
        base64Length: imageBase64.length,
        isDataUrl: imageSrc.startsWith('data:')
      });
      
      const result = await analyzeOutfit(
        selectedGender, 
        feedbackMode, 
        imageBase64, 
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
          // Check if this is the user's first upload to determine if we should save style analysis
          const { data: existingUploads, error: countError } = await supabase
            .from('wardrobe_items')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          const isFirstUpload = !countError && (!existingUploads || existingUploads.length === 0);
          
          console.log('Upload info:', { isFirstUpload, existingCount: existingUploads?.length || 0 });

          // Only include style analysis for the first upload
          const styleAnalysisToSave = isFirstUpload && result.styleAnalysis 
            ? JSON.parse(JSON.stringify({ styleAnalysis: result.styleAnalysis })) 
            : null;

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
              extracted_clothing_items: styleAnalysisToSave
            });

          if (saveError) {
            console.error('Error saving outfit to database:', saveError);
          } else {
            console.log('Outfit saved to database successfully');
            if (isFirstUpload) {
              console.log('Style analysis saved (first upload)');
            } else {
              console.log('Style analysis skipped (not first upload)');
            }
            // Trigger refresh of outfits list
            window.dispatchEvent(new CustomEvent('outfitSaved'));
          }
        }
      } catch (saveError) {
        console.error('Failed to save outfit:', saveError);
      }
      
      toast.success('Analysis complete!');
    } catch (error) {
      const analysisTime = performance.now() - analysisStartTime;
      console.error('AnalyzeButton: Analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration: analysisTime.toFixed(2) + 'ms'
      });
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to analyze your outfit. Please try again.';
      
      if (error instanceof Error) {
        // Use the error message directly if it's already user-friendly
        if (error.name === 'AnalysisTimeoutError' || 
            error.name === 'NetworkError' || 
            error.name === 'ServiceUnavailableError') {
          errorMessage = error.message;
        } else if (error.message.includes('timeout') || error.message.includes('longer than expected')) {
          errorMessage = 'Analysis is taking longer than expected. Try uploading a smaller image or try again later.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error occurred. Please check your connection and try again.';
        } else if (error.message.includes('temporarily unavailable') || error.message.includes('temporarily busy')) {
          errorMessage = 'AI service is temporarily busy. Please try again in a moment.';
        } else if (error.message.includes('Invalid response')) {
          errorMessage = 'Unable to process the image. Please try with a different photo.';
        } else if (error.message.includes('Authentication required') || error.message.includes('unauthorized')) {
          errorMessage = 'Authentication error. Please try logging out and back in.';
        }
      }
      
      toast.error(errorMessage, { duration: 5000 });
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
