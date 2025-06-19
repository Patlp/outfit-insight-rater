
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { extractClothingFromImage } from '@/services/clothing/extraction/clothingExtractionService';
import { processImageCropping } from '@/services/clothing/croppingService';
import { SaveOutfitResult } from './types';
import { triggerContextAwareAIImageGeneration } from './aiImageIntegration';

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
    console.log('💾 Starting CONTEXT-AWARE outfit save process with maximum accuracy AI generation...');

    // Save the outfit to wardrobe with the original image URL preserved
    const { data: wardrobeItem, error } = await supabase
      .from('wardrobe_items')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        original_image_url: imageUrl, // Set the new column with the original image URL
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

    console.log('✅ Outfit saved with ID:', wardrobeItem.id, 'with original image URL preserved:', imageUrl);

    // Start CONTEXT-AWARE AI-powered processing pipeline
    if (imageFile && wardrobeItem.id) {
      console.log('🚀 Starting CONTEXT-AWARE AI processing pipeline with maximum accuracy generation...');
      
      // Process in background with context-aware accuracy, passing the preserved image URL
      processOutfitWithContextAwareAIPipeline(wardrobeItem.id, imageFile, feedback, suggestions, imageUrl)
        .catch(error => {
          console.error('❌ Context-aware AI processing pipeline failed:', error);
        });
    }

    return { wardrobeItem };

  } catch (error) {
    console.error('❌ Unexpected error saving outfit:', error);
    return { error: 'Failed to save outfit' };
  }
};

// Context-aware AI processing pipeline with maximum accuracy
const processOutfitWithContextAwareAIPipeline = async (
  wardrobeItemId: string, 
  imageFile: File, 
  feedback: string, 
  suggestions: string[],
  originalImageUrl: string
): Promise<void> => {
  try {
    console.log('🚀 Starting CONTEXT-AWARE AI processing pipeline for wardrobe item:', wardrobeItemId);
    console.log('📸 Using original image URL for clothing items:', originalImageUrl);

    // Step 1: Enhanced Clothing Extraction with taxonomy integration
    console.log('🔍 Step 1: Running enhanced clothing extraction with taxonomy integration...');
    const extractionResult = await extractClothingFromImage(
      imageFile, 
      wardrobeItemId, 
      feedback, 
      suggestions
    );
    
    if (extractionResult.success && extractionResult.clothingItems && extractionResult.clothingItems.length > 0) {
      console.log(`✅ Enhanced clothing extraction successful: ${extractionResult.clothingItems.length} items`);
      
      // Step 2: Professional Image Cropping
      console.log('✂️ Step 2: Processing professional image cropping...');
      const croppedImages = await processImageCropping(imageFile, wardrobeItemId);
      
      if (croppedImages.length > 0) {
        console.log(`📸 Successfully cropped ${croppedImages.length} items for context-aware generation`);
        
        await updateWardrobeItemWithCroppedImages(wardrobeItemId, croppedImages);
        
        // Step 3: Enhanced clothing items with contextual metadata and original image URL
        const contextualClothingItems = await enhanceClothingItemsWithContextualData(
          extractionResult.clothingItems,
          croppedImages,
          originalImageUrl
        );
        
        await updateWardrobeItemWithContextualClothingItems(wardrobeItemId, contextualClothingItems);
        
        // Step 4: CONTEXT-AWARE Professional AI Generation with maximum accuracy
        console.log('🎯 Step 4: Triggering CONTEXT-AWARE professional AI generation with maximum accuracy...');
        await triggerContextAwareAIImageGeneration(wardrobeItemId, 'context_aware_openai');
        
        console.log('🎯 CONTEXT-AWARE AI processing pipeline completed successfully');
      } else {
        console.warn('⚠️ No items cropped, using context-aware generation with original image');
        // Still enhance the clothing items with the original image URL even if cropping failed
        const contextualClothingItems = await enhanceClothingItemsWithContextualData(
          extractionResult.clothingItems,
          [],
          originalImageUrl
        );
        
        await updateWardrobeItemWithContextualClothingItems(wardrobeItemId, contextualClothingItems);
        await triggerContextAwareAIImageGeneration(wardrobeItemId, 'context_aware_openai');
      }
      
    } else {
      console.warn('⚠️ Enhanced clothing extraction failed:', extractionResult.error);
      await logProcessingFailure(wardrobeItemId, 'contextual_extraction', extractionResult.error);
    }

  } catch (error) {
    console.error('❌ Context-aware AI processing pipeline error:', error);
    await logProcessingFailure(wardrobeItemId, 'contextual_pipeline_error', error instanceof Error ? error.message : 'Unknown error');
  }
};

// Enhanced function to add contextual metadata to clothing items with original image URL
const enhanceClothingItemsWithContextualData = async (
  clothingItems: any[],
  croppedImages: any[],
  originalImageUrl?: string
): Promise<any[]> => {
  console.log('🔗 Enhancing clothing items with contextual metadata for accurate generation...');
  console.log('📸 Original image URL being preserved for all items:', originalImageUrl);
  
  return clothingItems.map((item, index) => {
    // Advanced matching algorithm for cropped images
    const matchingCroppedImage = croppedImages.find(croppedImg => {
      const itemName = item.name?.toLowerCase() || '';
      const croppedName = croppedImg.item_name?.toLowerCase() || '';
      
      // Multi-level matching: exact, contains, word overlap
      return itemName === croppedName || 
             itemName.includes(croppedName) || 
             croppedName.includes(itemName) ||
             itemName.split(' ').some(word => croppedName.split(' ').includes(word));
    });
    
    const enhancedItem = {
      ...item,
      contextualProcessing: true,
      accuracyLevel: 'maximum',
      originalImageUrl: originalImageUrl || item.originalImageUrl // Ensure this is set for all items
    };
    
    if (matchingCroppedImage) {
      console.log(`✅ Contextual match: "${item.name}" → cropped image for accurate generation`);
      console.log(`📸 Setting originalImageUrl for "${item.name}": ${originalImageUrl}`);
      return {
        ...enhancedItem,
        croppedImageUrl: matchingCroppedImage.cropped_image_url,
        boundingBox: matchingCroppedImage.bounding_box,
        croppingConfidence: matchingCroppedImage.confidence,
        imageType: 'cropped_contextual'
      };
    } else {
      console.log(`⚠️ No contextual match for "${item.name}" - will use context-aware generation`);
      console.log(`📸 Setting originalImageUrl for "${item.name}": ${originalImageUrl}`);
      return {
        ...enhancedItem,
        imageType: 'needs_contextual_generation'
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

const updateWardrobeItemWithContextualClothingItems = async (
  wardrobeItemId: string,
  contextualClothingItems: any[]
): Promise<void> => {
  try {
    console.log(`💾 Updating wardrobe item ${wardrobeItemId} with contextual clothing items`);
    
    const { error } = await supabase
      .from('wardrobe_items')
      .update({
        extracted_clothing_items: contextualClothingItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', wardrobeItemId);

    if (error) {
      console.error('❌ Error updating wardrobe item with contextual clothing items:', error);
      throw error;
    }

    console.log('✅ Successfully updated wardrobe item with contextual clothing items');
  } catch (error) {
    console.error('❌ Failed to update wardrobe item with contextual clothing items:', error);
    throw error;
  }
};

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
