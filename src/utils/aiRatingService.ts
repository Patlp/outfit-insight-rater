
import { Gender, FeedbackMode, RatingResult, OccasionContext } from '@/context/RatingContext';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';

export const analyzeOutfit = async (
  gender: Gender, 
  feedbackMode: FeedbackMode, 
  imageBase64: string,
  occasionContext?: OccasionContext | null
): Promise<RatingResult> => {
  try {
    console.log('🚀 Starting outfit analysis service...');
    console.log('📸 Gender:', gender);
    console.log('📸 Feedback mode:', feedbackMode);
    console.log('📸 Image data length:', imageBase64.length);
    console.log('🎯 Occasion context:', occasionContext);

    // First, analyze the outfit
    const startTime = Date.now();
    console.log('🤖 Calling analyze-outfit function...');
    
    const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-outfit', {
      body: {
        gender,
        feedbackMode,
        imageBase64,
        eventContext: occasionContext?.eventContext || null,
        isNeutral: occasionContext?.isNeutral || false
      }
    });

    const apiDuration = Date.now() - startTime;
    console.log(`🤖 API call completed in ${apiDuration}ms`);

    if (analysisError) {
      console.error('💥 AI Analysis error:', analysisError);
      throw new Error(analysisError.message || 'Failed to analyze outfit');
    }

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

    const totalDuration = Date.now() - startTime;
    console.log(`🏁 Total analysis completed in ${totalDuration}ms`);

    return ratingResult;
  } catch (error) {
    console.error('💥 Analysis service error:', error);
    console.error('💥 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};
