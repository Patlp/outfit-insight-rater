
import { Gender, FeedbackMode, RatingResult } from '@/context/RatingContext';
import { supabase } from '@/integrations/supabase/client';

export const analyzeOutfit = async (
  gender: Gender, 
  feedbackMode: FeedbackMode, 
  imageBase64: string
): Promise<RatingResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-outfit', {
      body: {
        gender,
        feedbackMode,
        imageBase64
      }
    });

    if (error) {
      console.error('AI Analysis error:', error);
      throw new Error(error.message || 'Failed to analyze outfit');
    }

    if (!data || !data.score) {
      throw new Error('Invalid response from AI service');
    }

    return data as RatingResult;
  } catch (error) {
    console.error('Analysis service error:', error);
    throw error;
  }
};
