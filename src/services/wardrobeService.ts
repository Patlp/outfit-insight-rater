
import { supabase } from '@/integrations/supabase/client';
import { extractFashionTagsWithVision, fileToBase64 } from './clothing/visionTaggingService';

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
  feedbackMode: string = 'normal',
  imageFile?: File
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

    // Process vision-based tagging if image file is available
    if (imageFile) {
      try {
        console.log('🔍 Starting OpenAI vision tagging...');
        
        const imageBase64 = await fileToBase64(imageFile);
        const visionResult = await extractFashionTagsWithVision(imageBase64, wardrobeItem.id);

        if (visionResult.success && visionResult.tags.length > 0) {
          // Format tags for storage
          const formattedTags = visionResult.tags.map(tag => ({
            name: tag,
            descriptors: [],
            category: categorizeTag(tag),
            confidence: 0.9,
            source: 'openai-vision'
          }));

          // Update wardrobe item with vision tags
          const { error: updateError } = await supabase
            .from('wardrobe_items')
            .update({
              extracted_clothing_items: formattedTags,
              updated_at: new Date().toISOString()
            })
            .eq('id', wardrobeItem.id);

          if (updateError) {
            console.warn('Failed to save vision tags:', updateError);
          } else {
            console.log(`✅ Saved ${formattedTags.length} vision tags to wardrobe item`);
          }
        } else {
          console.warn('Vision tagging failed or returned no tags:', visionResult.error);
        }
      } catch (visionError) {
        console.warn('Vision tagging error (continuing with save):', visionError);
        // Don't fail the entire save operation if vision tagging fails
      }
    } else {
      console.log('No image file provided, skipping vision tagging');
    }

    return { wardrobeItem };

  } catch (error) {
    console.error('Error saving outfit to wardrobe:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Helper function to categorize tags based on clothing type
const categorizeTag = (tag: string): string => {
  const lowerTag = tag.toLowerCase();
  
  if (lowerTag.includes('shirt') || lowerTag.includes('blouse') || lowerTag.includes('top') || 
      lowerTag.includes('tee') || lowerTag.includes('sweater') || lowerTag.includes('cardigan') || 
      lowerTag.includes('hoodie') || lowerTag.includes('tank') || lowerTag.includes('polo')) {
    return 'tops';
  }
  
  if (lowerTag.includes('pants') || lowerTag.includes('jeans') || lowerTag.includes('trousers') || 
      lowerTag.includes('shorts') || lowerTag.includes('skirt') || lowerTag.includes('leggings')) {
    return 'bottoms';
  }
  
  if (lowerTag.includes('dress') || lowerTag.includes('gown')) {
    return 'dresses';
  }
  
  if (lowerTag.includes('jacket') || lowerTag.includes('blazer') || lowerTag.includes('coat') || 
      lowerTag.includes('vest') || lowerTag.includes('cardigan')) {
    return 'outerwear';
  }
  
  if (lowerTag.includes('shoes') || lowerTag.includes('sneakers') || lowerTag.includes('heels') || 
      lowerTag.includes('boots') || lowerTag.includes('sandals') || lowerTag.includes('flats') ||
      lowerTag.includes('loafers')) {
    return 'footwear';
  }
  
  if (lowerTag.includes('belt') || lowerTag.includes('bag') || lowerTag.includes('hat') || 
      lowerTag.includes('scarf') || lowerTag.includes('necklace') || lowerTag.includes('bracelet') || 
      lowerTag.includes('watch') || lowerTag.includes('earrings') || lowerTag.includes('sunglasses') ||
      lowerTag.includes('beanie') || lowerTag.includes('cap') || lowerTag.includes('clips')) {
    return 'accessories';
  }
  
  return 'other';
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
