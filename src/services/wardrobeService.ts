
import { supabase } from '@/integrations/supabase/client';

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
  cropped_images: any | null;
  processing_errors?: any | null;
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
  originalImageUrl: string,
  ratingScore: number,
  feedback: string,
  suggestions: string[],
  gender: string,
  occasionContext?: string,
  feedbackMode: string = 'normal',
  imageFile?: File
): Promise<SaveOutfitResult> => {
  try {
    console.log('🔄 Saving outfit to wardrobe with AI-powered processing for user:', userId);
    console.log('📸 Using original image URL:', originalImageUrl);

    // Insert the wardrobe item with the original image URL
    const { data: wardrobeItem, error: insertError } = await supabase
      .from('wardrobe_items')
      .insert({
        user_id: userId,
        image_url: originalImageUrl,
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
      console.error('❌ Error inserting wardrobe item:', insertError);
      return { error: insertError.message };
    }

    console.log('✅ Wardrobe item saved with ID:', wardrobeItem.id);
    console.log('📸 Original image URL stored:', wardrobeItem.image_url);

    // Start AI-powered processing in background if image file is available
    if (imageFile) {
      try {
        console.log('🚀 Starting comprehensive AI processing pipeline...');
        
        // Import and use the new comprehensive extraction service
        const { extractClothingFromImage } = await import('./clothing/extraction/clothingExtractionService');
        
        // Process in background
        extractClothingFromImage(imageFile, wardrobeItem.id, feedback, suggestions)
          .then(async (result) => {
            if (result.success) {
              console.log(`✅ AI processing completed using method: ${result.method}`);
              
              // Trigger AI image generation for extracted items
              const { triggerAIImageGeneration } = await import('./wardrobe/aiImageIntegration');
              await triggerAIImageGeneration(wardrobeItem.id);
            } else {
              console.warn('⚠️ AI processing failed:', result.error);
            }
          })
          .catch(error => {
            console.error('❌ Background AI processing error:', error);
          });

      } catch (processingError) {
        console.error('❌ Failed to start AI processing:', processingError);
      }
    } else {
      console.log('📷 No image file provided for AI processing');
    }

    return { wardrobeItem };

  } catch (error) {
    console.error('❌ Error saving outfit to wardrobe:', error);
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
