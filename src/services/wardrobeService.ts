
import { supabase } from '@/integrations/supabase/client';
import { extractClothingTagsWithGoogleVision } from './googleVision';

export interface WardrobeItem {
  id: string;
  user_id: string;
  image_url: string;
  rating_score: number | null;
  feedback: string | null;
  suggestions: string[] | null;
  gender: string | null;
  occasion_context: string | null;
  feedback_mode: string | null;
  extracted_clothing_items: any | null;
  created_at: string;
  updated_at: string;
}

export const saveOutfitToWardrobe = async (
  userId: string,
  imageUrl: string,
  ratingScore: number,
  feedback: string,
  suggestions: string[],
  gender: string,
  occasionContext?: string,
  feedbackMode: string = 'normal'
): Promise<{ success: boolean; wardrobeItemId?: string; error?: string }> => {
  try {
    console.log('Saving outfit to wardrobe with enhanced tagging...');
    
    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        rating_score: ratingScore,
        feedback,
        suggestions,
        gender,
        occasion_context: occasionContext,
        feedback_mode: feedbackMode
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving outfit to wardrobe:', error);
      return { success: false, error: error.message };
    }

    console.log('Outfit saved successfully:', data.id);

    // Trigger Google Vision tagging in the background
    extractClothingTagsWithGoogleVision(imageUrl, data.id, feedback, suggestions)
      .then(result => {
        if (result.success) {
          console.log(`Google Vision tagging completed for wardrobe item ${data.id} using method: ${result.method}`);
        } else {
          console.error(`Google Vision tagging failed for wardrobe item ${data.id}:`, result.error);
        }
      })
      .catch(error => {
        console.error(`Google Vision tagging error for wardrobe item ${data.id}:`, error);
      });

    return { success: true, wardrobeItemId: data.id };
  } catch (error) {
    console.error('Unexpected error saving outfit to wardrobe:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const getWardrobeItems = async (userId: string): Promise<{ success: boolean; items?: WardrobeItem[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wardrobe items:', error);
      return { success: false, error: error.message };
    }

    return { success: true, items: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching wardrobe items:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const deleteWardrobeItem = async (itemId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('wardrobe_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting wardrobe item:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting wardrobe item:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
