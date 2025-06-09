
import { supabase } from '@/integrations/supabase/client';
import { processAutoWardrobeTagging } from './clothing/autoWardrobeService';

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

export interface SaveOutfitResult {
  wardrobeItem?: WardrobeItem;
  error?: string;
}

export interface GetWardrobeItemsResult {
  items?: WardrobeItem[];
  error?: string;
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
): Promise<SaveOutfitResult> => {
  try {
    console.log('Saving outfit to wardrobe for user:', userId);

    // Insert the wardrobe item
    const { data: wardrobeItem, error: insertError } = await supabase
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

    if (insertError) {
      console.error('Error inserting wardrobe item:', insertError);
      return { error: insertError.message };
    }

    console.log('Wardrobe item saved:', wardrobeItem.id);

    // Process auto wardrobe tagging with the new clean extraction
    try {
      const taggingResult = await processAutoWardrobeTagging(
        wardrobeItem.id,
        feedback,
        suggestions
      );

      if (!taggingResult.success) {
        console.warn('Auto wardrobe tagging failed:', taggingResult.error);
        // Don't fail the entire save operation, just log the warning
      } else {
        console.log(`Auto wardrobe tagging successful: ${taggingResult.tags.length} tags extracted`);
      }
    } catch (taggingError) {
      console.warn('Auto wardrobe tagging error:', taggingError);
      // Continue without failing the save operation
    }

    return { wardrobeItem };

  } catch (error) {
    console.error('Error saving outfit to wardrobe:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getWardrobeItems = async (userId: string): Promise<GetWardrobeItemsResult> => {
  try {
    console.log('Fetching wardrobe items for user:', userId);

    const { data: items, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wardrobe items:', error);
      return { error: error.message };
    }

    console.log(`Fetched ${items?.length || 0} wardrobe items`);
    return { items: items || [] };

  } catch (error) {
    console.error('Error in getWardrobeItems:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const deleteWardrobeItem = async (itemId: string): Promise<{ error?: string }> => {
  try {
    console.log('Deleting wardrobe item:', itemId);

    const { error } = await supabase
      .from('wardrobe_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting wardrobe item:', error);
      return { error: error.message };
    }

    console.log('Wardrobe item deleted successfully');
    return {};

  } catch (error) {
    console.error('Error in deleteWardrobeItem:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
