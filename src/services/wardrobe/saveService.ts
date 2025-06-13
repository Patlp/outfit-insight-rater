
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { extractClothingFromImage } from '@/services/clothing/extraction/clothingExtractionService';
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
    console.log('💾 Starting outfit save process with AI-powered extraction...');

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

    // Start comprehensive AI-powered processing in background
    if (imageFile && wardrobeItem.id) {
      console.log('🔄 Starting comprehensive AI processing pipeline...');
      
      // Process in background - don't await to avoid blocking the response
      processOutfitWithAIPipeline(wardrobeItem.id, imageFile, feedback, suggestions)
        .catch(error => {
          console.error('❌ AI processing pipeline failed:', error);
        });
    }

    return { wardrobeItem };

  } catch (error) {
    console.error('❌ Unexpected error saving outfit:', error);
    return { error: 'Failed to save outfit' };
  }
};

// Comprehensive AI processing pipeline
const processOutfitWithAIPipeline = async (
  wardrobeItemId: string, 
  imageFile: File, 
  feedback: string, 
  suggestions: string[]
): Promise<void> => {
  try {
    console.log('🚀 Starting comprehensive AI processing for wardrobe item:', wardrobeItemId);

    // Step 1: AI-Powered Clothing Extraction (Vision + Text + Datasets)
    console.log('🔍 Step 1: Running AI-powered clothing extraction...');
    const extractionResult = await extractClothingFromImage(
      imageFile, 
      wardrobeItemId, 
      feedback, 
      suggestions
    );
    
    if (extractionResult.success && extractionResult.clothingItems && extractionResult.clothingItems.length > 0) {
      console.log(`✅ Clothing extraction successful using method: ${extractionResult.method}`);
      console.log(`📝 Extracted ${extractionResult.clothingItems.length} clothing items`);
      
      // Step 2: Trigger AI Image Generation for extracted items
      console.log('🎨 Step 2: Triggering AI image generation...');
      await triggerAIImageGeneration(wardrobeItemId);
      
      console.log('🎯 AI processing pipeline completed successfully');
    } else {
      console.warn('⚠️ Clothing extraction failed:', extractionResult.error);
      
      // Log the failure for analytics
      await logProcessingFailure(wardrobeItemId, 'clothing_extraction', extractionResult.error);
    }

  } catch (error) {
    console.error('❌ AI processing pipeline error:', error);
    await logProcessingFailure(wardrobeItemId, 'pipeline_error', error instanceof Error ? error.message : 'Unknown error');
  }
};

// Helper function to log processing failures for debugging
const logProcessingFailure = async (wardrobeItemId: string, failureType: string, errorMessage?: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('wardrobe_items')
      .update({
        processing_errors: {
          type: failureType,
          message: errorMessage,
          timestamp: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', wardrobeItemId);

    if (error) {
      console.error('Failed to log processing failure:', error);
    }
  } catch (logError) {
    console.error('Error logging processing failure:', logError);
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
