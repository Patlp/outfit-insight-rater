
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
    // First, analyze the outfit
    const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-outfit', {
      body: {
        gender,
        feedbackMode,
        imageBase64,
        eventContext: occasionContext?.eventContext || null,
        isNeutral: occasionContext?.isNeutral || false
      }
    });

    if (analysisError) {
      console.error('AI Analysis error:', analysisError);
      throw new Error(analysisError.message || 'Failed to analyze outfit');
    }

    if (!analysisData || !analysisData.score) {
      throw new Error('Invalid response from AI service');
    }

    const ratingResult = analysisData as RatingResult;

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

    return ratingResult;
  } catch (error) {
    console.error('Analysis service error:', error);
    throw error;
  }
};
