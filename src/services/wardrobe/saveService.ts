
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { extractClothingFromImage } from '@/services/clothing/extraction/clothingExtractionService';
import { processImageCropping } from '@/services/clothing/croppingService';
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
    console.log('💾 Starting enhanced outfit save process with TheNewBlack integration...');

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

    // Start comprehensive AI-powered processing pipeline in background
    if (imageFile && wardrobeItem.id) {
      console.log('🚀 Starting comprehensive AI processing pipeline with TheNewBlack integration...');
      
      // Process in background - don't await to avoid blocking the response
      processOutfitWithEnhancedAIPipeline(wardrobeItem.id, imageFile, feedback, suggestions, imageUrl)
        .catch(error => {
          console.error('❌ Enhanced AI processing pipeline failed:', error);
        });
    }

    return { wardrobeItem };

  } catch (error) {
    console.error('❌ Unexpected error saving outfit:', error);
    return { error: 'Failed to save outfit' };
  }
};

// Enhanced AI processing pipeline with TheNewBlack integration and cropping
const processOutfitWithEnhancedAIPipeline = async (
  wardrobeItemId: string, 
  imageFile: File, 
  feedback: string, 
  suggestions: string[],
  originalImageUrl: string
): Promise<void> => {
  try {
    console.log('🚀 Starting enhanced AI processing pipeline for wardrobe item:', wardrobeItemId);

    // Step 1: AI-Powered Clothing Extraction
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
      
      // Step 2: Process Image Cropping for individual items
      console.log('✂️ Step 2: Processing image cropping for individual items...');
      const croppedImages = await processImageCropping(imageFile, wardrobeItemId);
      
      if (croppedImages.length > 0) {
        console.log(`📸 Successfully cropped ${croppedImages.length} individual clothing items`);
        
        // Update wardrobe item with cropped images
        await updateWardrobeItemWithCroppedImages(wardrobeItemId, croppedImages);
        
        // Step 3: Enhanced clothing items with cropped image URLs
        const enhancedClothingItems = await enhanceClothingItemsWithCroppedImages(
          extractionResult.clothingItems,
          croppedImages
        );
        
        // Update the wardrobe item with enhanced clothing items
        await updateWardrobeItemWithEnhancedClothingItems(wardrobeItemId, enhancedClothingItems);
        
        // Step 4: Trigger TheNewBlack Ghost Mannequin generation
        console.log('🎨 Step 4: Triggering TheNewBlack Ghost Mannequin generation...');
        await triggerAIImageGeneration(wardrobeItemId, 'thenewblack');
        
        console.log('🎯 Enhanced AI processing pipeline completed successfully');
      } else {
        console.warn('⚠️ No items were successfully cropped, proceeding with basic extraction');
        
        // Still trigger TheNewBlack with original image as fallback
        console.log('🎨 Triggering TheNewBlack with original image as fallback...');
        await triggerAIImageGeneration(wardrobeItemId, 'thenewblack');
      }
      
    } else {
      console.warn('⚠️ Clothing extraction failed:', extractionResult.error);
      await logProcessingFailure(wardrobeItemId, 'clothing_extraction', extractionResult.error);
    }

  } catch (error) {
    console.error('❌ Enhanced AI processing pipeline error:', error);
    await logProcessingFailure(wardrobeItemId, 'pipeline_error', error instanceof Error ? error.message : 'Unknown error');
  }
};

// Enhanced function to match clothing items with cropped images
const enhanceClothingItemsWithCroppedImages = async (
  clothingItems: any[],
  croppedImages: any[]
): Promise<any[]> => {
  console.log('🔗 Enhancing clothing items with cropped image URLs...');
  
  return clothingItems.map((item, index) => {
    // Try to find matching cropped image by name similarity
    const matchingCroppedImage = croppedImages.find(croppedImg => {
      const itemName = item.name?.toLowerCase() || '';
      const croppedName = croppedImg.item_name?.toLowerCase() || '';
      
      // Simple matching logic - can be enhanced with better algorithms
      return itemName.includes(croppedName) || croppedName.includes(itemName) ||
             itemName.split(' ').some(word => croppedName.includes(word));
    });
    
    if (matchingCroppedImage) {
      console.log(`✅ Matched "${item.name}" with cropped image: ${matchingCroppedImage.cropped_image_url}`);
      return {
        ...item,
        croppedImageUrl: matchingCroppedImage.cropped_image_url,
        boundingBox: matchingCroppedImage.bounding_box,
        croppingConfidence: matchingCroppedImage.confidence,
        imageType: 'cropped_original'
      };
    } else {
      console.log(`⚠️ No cropped image match found for "${item.name}"`);
      return {
        ...item,
        imageType: 'needs_generation'
      };
    }
  });
};

// Update wardrobe item with cropped images metadata
const updateWardrobeItemWithCroppedImages = async (
  wardrobeItemId: string,
  croppedImages: any[]
): Promise<void> => {
  try {
    console.log(`💾 Updating wardrobe item ${wardrobeItemId} with cropped images metadata`);
    
    const { error } = await supabase
      .from('wardrobe_items')
      .update({
        cropped_images: croppedImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', wardrobeItemId);

    if (error) {
      console.error('❌ Error updating wardrobe item with cropped images:', error);
      throw error;
    }

    console.log('✅ Successfully updated wardrobe item with cropped images metadata');
  } catch (error) {
    console.error('❌ Failed to update wardrobe item with cropped images:', error);
    throw error;
  }
};

// Update wardrobe item with enhanced clothing items
const updateWardrobeItemWithEnhancedClothingItems = async (
  wardrobeItemId: string,
  enhancedClothingItems: any[]
): Promise<void> => {
  try {
    console.log(`💾 Updating wardrobe item ${wardrobeItemId} with enhanced clothing items`);
    
    const { error } = await supabase
      .from('wardrobe_items')
      .update({
        extracted_clothing_items: enhancedClothingItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', wardrobeItemId);

    if (error) {
      console.error('❌ Error updating wardrobe item with enhanced clothing items:', error);
      throw error;
    }

    console.log('✅ Successfully updated wardrobe item with enhanced clothing items');
  } catch (error) {
    console.error('❌ Failed to update wardrobe item with enhanced clothing items:', error);
    throw error;
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
