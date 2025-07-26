
import { Gender, FeedbackMode, RatingResult, OccasionContext } from '@/context/RatingContext';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { performanceMonitor } from '@/utils/performanceMonitor';

// Enhanced error types for better user feedback
class AnalysisTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisTimeoutError';
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

export const analyzeOutfit = async (
  gender: Gender, 
  feedbackMode: FeedbackMode, 
  imageBase64: string,
  occasionContext?: OccasionContext | null
): Promise<RatingResult> => {
  const analysisId = `outfit-analysis-${Date.now()}`;
  
  try {
    console.log('🚀 Starting outfit analysis service...');
    console.log('📸 Gender:', gender);
    console.log('📸 Feedback mode:', feedbackMode);
    console.log('📸 Image data length:', imageBase64.length);
    console.log('🎯 Occasion context:', occasionContext);

    performanceMonitor.start(analysisId, {
      gender,
      feedbackMode,
      imageSize: imageBase64.length,
      hasOccasionContext: !!occasionContext
    });

    // Retry logic with exponential backoff
    const retryWithBackoff = async (attempt: number = 1): Promise<any> => {
      const startTime = Date.now();
      console.log(`🤖 Calling analyze-outfit function (attempt ${attempt})...`);
      
      try {
        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn(`⏰ Analysis timeout after 90 seconds (attempt ${attempt})`);
          controller.abort();
        }, 90000); // 90 second timeout (reduced from 120s)
        
        // Validate imageBase64 before sending
        if (!imageBase64 || imageBase64.length < 100) {
          throw new Error('Invalid image data - image appears to be empty or too small');
        }
        
        // Check if it's valid base64
        try {
          // Try to decode a small portion to validate it's proper base64
          atob(imageBase64.substring(0, 100));
        } catch (e) {
          throw new Error('Invalid image data - not valid base64 format');
        }
        
        const requestBody = {
          gender,
          feedbackMode,
          imageBase64,
          eventContext: occasionContext?.eventContext || null,
          isNeutral: occasionContext?.isNeutral || false
        };
        
        console.log('🤖 Sending request to analyze-outfit function:', {
          gender,
          feedbackMode,
          imageBase64Length: imageBase64.length,
          imageBase64Preview: imageBase64.substring(0, 50) + '...',
          eventContext: occasionContext?.eventContext || null,
          isNeutral: occasionContext?.isNeutral || false,
          attempt
        });
        
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-outfit', {
          body: requestBody,
          headers: {
            'Content-Type': 'application/json',
          }
        });

        clearTimeout(timeoutId);
        
        if (analysisError) {
          console.error(`❌ Supabase function error (attempt ${attempt}):`, {
            message: analysisError.message,
            details: analysisError.details,
            hint: analysisError.hint,
            code: analysisError.code,
            status: analysisError.status,
            statusText: analysisError.statusText,
            fullError: analysisError
          });
          
          // Handle specific error types
          if (analysisError.message?.includes('timeout') || analysisError.message?.includes('Function timeout')) {
            throw new AnalysisTimeoutError('Analysis is taking longer than expected. Please try with a smaller image or try again later.');
          } else if (analysisError.message?.includes('network') || analysisError.message?.includes('fetch')) {
            throw new NetworkError('Network error occurred. Please check your connection and try again.');
          } else if (analysisError.message?.includes('503') || analysisError.message?.includes('temporarily unavailable')) {
            throw new ServiceUnavailableError('AI service is temporarily busy. Please try again in a moment.');
          }
          
          throw new Error(analysisError.message || 'Analysis failed');
        }
        
        return analysisData;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`❌ Attempt ${attempt} failed after ${duration}ms:`, error);
        
        // Check if it's a timeout or network error that we should retry
        const isRetryableError = 
          error.name === 'AbortError' ||
          error.message?.includes('timeout') ||
          error.message?.includes('network') ||
          error.message?.includes('fetch') ||
          (error.status && error.status >= 500);
        
        if (attempt < 3 && isRetryableError) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return retryWithBackoff(attempt + 1);
        }
        
        // Format error message for user based on error type
        if (error.name === 'AbortError' || error.message?.includes('timeout')) {
          throw new AnalysisTimeoutError('Analysis is taking longer than expected. Please try with a smaller image or try again later.');
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          throw new NetworkError('Network error occurred. Please check your connection and try again.');
        } else if (error.message?.includes('503') || error.message?.includes('temporarily unavailable')) {
          throw new ServiceUnavailableError('AI service is temporarily busy. Please try again in a moment.');
        }
        
        throw error;
      }
    };

    const analysisData = await retryWithBackoff();

    if (!analysisData || !analysisData.score) {
      console.error('💥 Invalid response structure:', analysisData);
      throw new Error('Invalid response from AI service');
    }

    console.log('✅ Analysis successful!');
    console.log('📊 Score received:', analysisData.score);
    console.log('📊 Feedback length:', analysisData.feedback?.length || 0);
    console.log('📊 Suggestions count:', analysisData.suggestions?.length || 0);
    console.log('🎨 Style analysis included:', !!analysisData.styleAnalysis);

    const ratingResult = analysisData as RatingResult;

    // Log style analysis details if present
    if (ratingResult.styleAnalysis) {
      console.log('🎨 STYLE ANALYSIS RECEIVED:');
      console.log('🎨 - Color type:', ratingResult.styleAnalysis.colorAnalysis?.seasonalType);
      console.log('🎨 - Undertone value:', ratingResult.styleAnalysis.colorAnalysis?.undertone?.value);
      console.log('🎨 - Intensity value:', ratingResult.styleAnalysis.colorAnalysis?.intensity?.value);
      console.log('🎨 - Lightness value:', ratingResult.styleAnalysis.colorAnalysis?.lightness?.value);
      console.log('🎨 - Color palette rows:', ratingResult.styleAnalysis.colorPalette?.colors?.length);
      console.log('🎨 - Body type:', ratingResult.styleAnalysis.bodyType?.type || 'Not analyzed');
    } else {
      console.warn('⚠️ No style analysis in response - this should not happen!');
    }

    // Temporarily commented out product recommendations
    /*
    // Then, generate product recommendations based on the feedback
    try {
      const { data: recommendationsData, error: recommendationsError } = await supabase.functions.invoke('generate-recommendations', {
        body: {
          feedback: ratingResult.feedback,
          suggestions: ratingResult.suggestions,
          gender
        }
      });

      if (!recommendationsError && recommendationsData?.recommendations) {
        ratingResult.recommendations = recommendationsData.recommendations as Product[];
      } else {
        console.warn('Failed to generate recommendations:', recommendationsError);
        // Continue without recommendations rather than failing the whole request
      }
    } catch (recommendationsError) {
      console.warn('Recommendations service error:', recommendationsError);
      // Continue without recommendations rather than failing the whole request
    }
    */

    console.log(`🏁 Analysis completed successfully`);
    
    performanceMonitor.end(analysisId);
    performanceMonitor.logMemoryUsage('analysis-complete');

    return ratingResult;
  } catch (error) {
    performanceMonitor.end(analysisId);
    performanceMonitor.logMemoryUsage('analysis-error');
    
    console.error('💥 Analysis service error:', error);
    console.error('💥 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};
