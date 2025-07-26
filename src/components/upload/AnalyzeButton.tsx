
import React, { useCallback, useRef } from 'react';
import { useRating } from '@/context/RatingContext';
import { useUploadSession } from '@/context/UploadSessionContext';
import { analyzeOutfit } from '@/utils/aiRatingService';
import { toast } from 'sonner';
import { useRequestDeduplication } from '@/hooks/useRequestDeduplication';
import { useImageComparison } from '@/hooks/useImageComparison';

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
  const { 
    isDuplicateRequest, 
    startRequest, 
    completeRequest, 
    failRequest, 
    canMakeRequest,
    pendingRequestCount 
  } = useRequestDeduplication({ dedupWindowMs: 45000 }); // 45 second window
  const { findSimilarImages } = useImageComparison();
  const lastAnalysisRef = useRef<{ imageBase64: string; timestamp: number } | null>(null);

  // Debounced analyze function to prevent rapid consecutive calls
  const handleAnalyze = useCallback(async () => {
    if (!imageFile || !imageSrc) {
      console.error('AnalyzeButton: Missing required data', { hasImageFile: !!imageFile, hasImageSrc: !!imageSrc });
      toast.error('Image data is missing. Please upload an image again.');
      return;
    }

    // Check if we can make a new request
    if (!canMakeRequest()) {
      toast.warning('Please wait for the current analysis to complete');
      console.log('🚫 Request blocked: too many concurrent requests');
      return;
    }
    
    // Prepare image data first for validation and deduplication
    let imageBase64 = imageSrc;
    
    // If it's a data URL, extract just the base64 part
    if (imageSrc.startsWith('data:')) {
      const base64Start = imageSrc.indexOf(',') + 1;
      imageBase64 = imageSrc.substring(base64Start);
    }

    // Check for duplicate requests early
    if (isDuplicateRequest(imageBase64, selectedGender, feedbackMode)) {
      toast.info('This analysis is already in progress or was recently completed');
      return;
    }

    // Check against last analysis to prevent immediate re-analysis of same image
    if (lastAnalysisRef.current) {
      const timeSinceLastAnalysis = Date.now() - lastAnalysisRef.current.timestamp;
      if (timeSinceLastAnalysis < 10000 && lastAnalysisRef.current.imageBase64 === imageBase64) {
        toast.info('Please wait before analyzing the same image again');
        console.log('🚫 Request blocked: same image analyzed recently');
        return;
      }
    }

    console.log('AnalyzeButton: Starting analysis', {
      gender: selectedGender,
      feedbackMode,
      imageSrcLength: imageSrc.length,
      occasionContext,
      pendingRequests: pendingRequestCount,
      timestamp: new Date().toISOString()
    });
    
    // Start request tracking
    const requestId = startRequest(imageBase64, selectedGender, feedbackMode);
    setIsAnalyzing(true);
    const analysisStartTime = performance.now();
    
    try {
      // Validate the base64 data
      if (!imageBase64 || imageBase64.length < 100) {
        console.error('AnalyzeButton: Invalid image data - too small or empty', {
          imageBase64Length: imageBase64?.length || 0,
          imageSrcLength: imageSrc?.length || 0
        });
        failRequest(requestId);
        toast.error('Invalid image data. Please try uploading the image again.');
        return;
      }
      
      // Test if it's valid base64
    try {
        atob(imageBase64.substring(0, 100));
      } catch (e) {
        console.error('AnalyzeButton: Invalid base64 format', {
          error: e,
          imageBase64Preview: imageBase64.substring(0, 100)
        });
        failRequest(requestId);
        toast.error('Invalid image format. Please try uploading the image again.');
        return;
      }
      
      console.log('AnalyzeButton: Image data prepared and validated', {
        originalLength: imageSrc.length,
        base64Length: imageBase64.length,
        isDataUrl: imageSrc.startsWith('data:'),
        base64Preview: imageBase64.substring(0, 50) + '...'
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

      // Update last analysis reference
      lastAnalysisRef.current = {
        imageBase64,
        timestamp: Date.now()
      };

      // Complete request tracking
      completeRequest(requestId);
      
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
      
      // Save to database for authenticated users with enhanced duplicate detection
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
          
          console.log('🎯 Upload info:', { isFirstUpload, existingCount: existingUploads?.length || 0 });

          // Enhanced duplicate detection: Check for recent similar saves (within 10 minutes)
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
          
          const { data: recentOutfits, error: checkError } = await supabase
            .from('wardrobe_items')
            .select('id, image_url, rating_score, feedback, created_at')
            .eq('user_id', user.id)
            .gte('created_at', tenMinutesAgo)
            .order('created_at', { ascending: false })
            .limit(3);

          // Check if we already have this exact outfit saved recently
          const isDuplicate = recentOutfits && recentOutfits.some(existing => 
            existing.rating_score === result.score &&
            existing.feedback?.length === result.feedback?.length &&
            Math.abs((existing.image_url?.length || 0) - imageSrc.length) < 100 // Similar image size
          );

          if (isDuplicate) {
            console.log('🎯 Duplicate outfit detected, skipping database save to prevent duplicate entry');
          } else {
            // Only include style analysis for the first upload
            const styleAnalysisToSave = isFirstUpload && result.styleAnalysis 
              ? JSON.parse(JSON.stringify({ styleAnalysis: result.styleAnalysis })) 
              : null;

            console.log('🎯 Saving new outfit analysis with quality metrics:');
            console.log('🎯 - Has structured feedback:', result.feedback?.includes('**') || false);
            console.log('🎯 - Feedback length:', result.feedback?.length || 0);
            console.log('🎯 - Suggestions count:', result.suggestions?.length || 0);

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
              console.log('🎯 Outfit saved to database successfully');
              if (isFirstUpload) {
                console.log('🎯 Style analysis saved (first upload)');
              } else {
                console.log('🎯 Style analysis skipped (not first upload)');
              }
              // Trigger refresh of outfits list with enhanced event data
              window.dispatchEvent(new CustomEvent('outfitSaved', { 
                detail: { 
                  timestamp: Date.now(), 
                  isFirstUpload,
                  qualityScore: (result.feedback?.includes('**') ? 10 : 0) + (result.suggestions?.length || 0) * 2
                } 
              }));
            }
          }
        }
      } catch (saveError) {
        console.error('Failed to save outfit:', saveError);
      }
      
      toast.success('Analysis complete!', {
        description: 'Your outfit has been analyzed and saved to your wardrobe'
      });
    } catch (error) {
      const analysisTime = performance.now() - analysisStartTime;
      
      // Mark request as failed
      failRequest(requestId);
      
      console.error('AnalyzeButton: Analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration: analysisTime.toFixed(2) + 'ms',
        requestId: requestId.substring(0, 50) + '...'
      });
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to analyze your outfit. Please try again.';
      let shouldSuggestRetry = true;
      
      if (error instanceof Error) {
        // Check for specific error patterns that indicate cold start issues
        if (error.message.includes('Failed to send a request to the Edge Function') ||
            error.message.includes('Load failed') ||
            error.message.includes('Network request failed')) {
          errorMessage = 'Service is starting up. Click "Rate My Outfit" again to try once more.';
          shouldSuggestRetry = true;
        } else if (error.name === 'AnalysisTimeoutError' || 
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
      
      const description = shouldSuggestRetry 
        ? 'The first attempt often requires an extra click to wake up the service. Please try again!' 
        : 'Please try again or contact support if the issue persists';
      
      toast.error(errorMessage, { 
        duration: 6000,
        description
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, imageSrc, selectedGender, feedbackMode, occasionContext, isDuplicateRequest, startRequest, completeRequest, failRequest, canMakeRequest, pendingRequestCount]);

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
          {pendingRequestCount > 1 && (
            <span className="text-xs opacity-75">({pendingRequestCount} in queue)</span>
          )}
        </>
      ) : (
        <span>{feedbackMode === 'roast' ? 'Roast My Outfit' : 'Rate My Outfit'}</span>
      )}
    </button>
  );
};

export default AnalyzeButton;
