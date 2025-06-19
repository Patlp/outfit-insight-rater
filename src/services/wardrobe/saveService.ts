import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { extractClothingFromImage } from '@/services/clothing/extraction/clothingExtractionService';
import { processImageCropping } from '@/services/clothing/croppingService';
import { SaveOutfitResult } from './types';
import { triggerEnhancedAIImageGeneration } from './aiImageIntegration';

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
    console.log('💾 Starting ENHANCED outfit save process with professional AI generation...');

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

    // Start ENHANCED AI-powered processing pipeline
    if (imageFile && wardrobeItem.id) {
      console.log('🚀 Starting ENHANCED AI processing pipeline with professional-grade generation...');
      
      // Process in background with enhanced quality
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

// Enhanced AI processing pipeline with professional-grade generation
const processOutfitWithEnhancedAIPipeline = async (
  wardrobeItemId: string, 
  imageFile: File, 
  feedback: string, 
  suggestions: string[],
  originalImageUrl: string
): Promise<void> => {
  try {
    console.log('🚀 Starting ENHANCED AI processing pipeline for wardrobe item:', wardrobeItemId);

    // Step 1: Enhanced Clothing Extraction
    console.log('🔍 Step 1: Running enhanced clothing extraction...');
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
        console.log(`📸 Successfully cropped ${croppedImages.length} items for enhanced generation`);
        
        await updateWardrobeItemWithCroppedImages(wardrobeItemId, croppedImages);
        
        // Step 3: Enhanced clothing items with professional metadata
        const enhancedClothingItems = await enhanceClothingItemsWithProfessionalData(
          extractionResult.clothingItems,
          croppedImages
        );
        
        await updateWardrobeItemWithEnhancedClothingItems(wardrobeItemId, enhancedClothingItems);
        
        // Step 4: ENHANCED Professional AI Generation with OpenAI only
        console.log('🎨 Step 4: Triggering ENHANCED professional AI generation with OpenAI...');
        await triggerEnhancedAIImageGeneration(wardrobeItemId, 'enhanced_openai');
        
        console.log('🎯 ENHANCED AI processing pipeline completed successfully');
      } else {
        console.warn('⚠️ No items cropped, using enhanced generation with original image');
        await triggerEnhancedAIImageGeneration(wardrobeItemId, 'enhanced_openai');
      }
      
    } else {
      console.warn('⚠️ Enhanced clothing extraction failed:', extractionResult.error);
      await logProcessingFailure(wardrobeItemId, 'enhanced_extraction', extractionResult.error);
    }

  } catch (error) {
    console.error('❌ Enhanced AI processing pipeline error:', error);
    await logProcessingFailure(wardrobeItemId, 'enhanced_pipeline_error', error instanceof Error ? error.message : 'Unknown error');
  }
};

// Enhanced function to add professional metadata to clothing items
const enhanceClothingItemsWithProfessionalData = async (
  clothingItems: any[],
  croppedImages: any[]
): Promise<any[]> => {
  console.log('🔗 Enhancing clothing items with professional metadata...');
  
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
    
    if (matchingCroppedImage) {
      console.log(`✅ Professional match: "${item.name}" → cropped image`);
      return {
        ...item,
        croppedImageUrl: matchingCroppedImage.cropped_image_url,
        boundingBox: matchingCroppedImage.bounding_box,
        croppingConfidence: matchingCroppedImage.confidence,
        imageType: 'cropped_professional',
        enhancedProcessing: true,
        qualityLevel: 'professional'
      };
    } else {
      console.log(`⚠️ No professional match for "${item.name}" - will use enhanced generation`);
      return {
        ...item,
        imageType: 'needs_enhanced_generation',
        enhancedProcessing: true,
        qualityLevel: 'professional'
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
