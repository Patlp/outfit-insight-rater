
import { supabase } from '@/integrations/supabase/client';
import { RatingResult, Gender } from '@/context/RatingContext';
import { extractClothingItems } from '@/utils/clothingExtractor';
import { extractClothingPhrasesAI } from './clothingExtractionService';

export interface WardrobeItem {
  id: string;
  user_id: string;
  image_url: string;
  rating_score: number | null;
  feedback: string | null;
  suggestions: string[] | null;
  occasion_context: string | null;
  gender: string | null;
  feedback_mode: string | null;
  extracted_clothing_items: any | null;
  created_at: string;
  updated_at: string;
}

export const saveOutfitToWardrobe = async (
  imageUrl: string,
  ratingResult: RatingResult,
  gender: Gender,
  occasionContext?: string,
  feedbackMode: string = 'normal'
): Promise<{ data: WardrobeItem | null; error: any }> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Extract clothing items from feedback for backward compatibility
    const extractedClothingItems = extractClothingItems(ratingResult.feedback || '');
    console.log('Saving outfit with extracted clothing items:', extractedClothingItems);

    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        rating_score: ratingResult.score,
        feedback: ratingResult.feedback,
        suggestions: ratingResult.suggestions,
        occasion_context: occasionContext,
        gender: gender,
        feedback_mode: feedbackMode,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving outfit to wardrobe:', error);
      return { data: null, error };
    }

    // Background process: Extract AI-powered clothing phrases
    // This runs asynchronously and won't block the main flow
    if (data && ratingResult.feedback) {
      console.log('Triggering background AI clothing extraction...');
      extractClothingPhrasesAI(
        ratingResult.feedback,
        ratingResult.suggestions || [],
        data.id
      ).then(result => {
        if (result.success) {
          console.log(`Background AI extraction completed for item ${data.id}`);
        } else {
          console.warn(`Background AI extraction failed for item ${data.id}:`, result.error);
        }
      }).catch(err => {
        console.warn(`Background AI extraction error for item ${data.id}:`, err);
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error saving outfit to wardrobe:', error);
    return { data: null, error };
  }
};

export const getUserWardrobeItems = async (): Promise<{ data: WardrobeItem[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    console.error('Error fetching wardrobe items:', error);
    return { data: null, error };
  }
};

export const deleteWardrobeItem = async (id: string): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('wardrobe_items')
      .delete()
      .eq('id', id);

    return { error };
  } catch (error) {
    console.error('Error deleting wardrobe item:', error);
    return { error };
  }
};
