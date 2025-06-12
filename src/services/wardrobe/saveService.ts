import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { extractClothingFromImage } from '@/services/clothing/extraction/clothingExtractionService';
import { updateWardrobeItemWithClothing } from './wardrobeService';
import { SaveOutfitResult } from './types';
import { triggerAIImageGeneration } from './aiImageIntegration';

export const saveOutfitToWardrobe = async (
  userId: string,
  imageUrl: string,
  score: number,
  feedback: string,
  suggestions: string[],
  gender?: string,
  occasionContext?: string,
  feedbackMode?: string,
  imageFile?: File
): Promise<SaveOutfitResult> => {
  try {
    console.log('💾 Starting outfit save process...');

    // Save the outfit to wardrobe
    const { data: wardrobeItem, error } = await supabase
      .from('wardrobe_items')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        rating_score: score,
        feedback,
        suggestions,
        gender,
        occasion_context: occasionContext,
        feedback_mode: feedbackMode || 'normal'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving outfit:', error);
      return { error: error.message };
    }

    console.log('✅ Outfit saved with ID:', wardrobeItem.id);

    // Start background processing for clothing extraction and AI image generation
    if (imageFile && wardrobeItem.id) {
      console.log('🔄 Starting background processing...');
      
      // Process in background - don't await to avoid blocking the response
      processOutfitInBackground(wardrobeItem.id, imageFile)
        .catch(error => {
          console.error('❌ Background processing failed:', error);
        });
    }

    return { wardrobeItem };

  } catch (error) {
    console.error('❌ Unexpected error saving outfit:', error);
    return { error: 'Failed to save outfit' };
  }
};

// Background processing function
const processOutfitInBackground = async (wardrobeItemId: string, imageFile: File): Promise<void> => {
  try {
    console.log('🔄 Starting background processing for wardrobe item:', wardrobeItemId);

    // Step 1: Extract clothing items using AI
    const extractionResult = await extractClothingFromImage(imageFile, wardrobeItemId);
    
    if (extractionResult.success && extractionResult.clothingItems) {
      console.log('✅ Clothing extraction completed, updating database...');
      
      // Update the wardrobe item with extracted clothing
      await updateWardrobeItemWithClothing(wardrobeItemId, extractionResult.clothingItems);
      
      // Step 2: Trigger AI image generation for each clothing item
      console.log('🎨 Triggering AI image generation...');
      await triggerAIImageGeneration(wardrobeItemId);
      
    } else {
      console.warn('⚠️ Clothing extraction failed:', extractionResult.error);
    }

  } catch (error) {
    console.error('❌ Background processing error:', error);
  }
};

export const deleteWardrobeItem = async (itemId: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('wardrobe_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting wardrobe item:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Unexpected error deleting wardrobe item:', error);
    return { error: 'Failed to delete wardrobe item' };
  }
};
