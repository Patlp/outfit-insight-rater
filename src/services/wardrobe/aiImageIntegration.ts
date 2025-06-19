
import { enhancedClothingImageGenerator } from '@/services/clothing/enhancedAIImageGeneration';
import { supabase } from '@/integrations/supabase/client';

type ImageProvider = 'enhanced_thenewblack' | 'enhanced_openai' | 'thenewblack' | 'openai';

// Type guard to check if Json is an array of clothing items
const isClothingItemsArray = (data: any): data is any[] => {
  return Array.isArray(data);
};

// Type guard to check if Json is an array of cropped images
const isCroppedImagesArray = (data: any): data is any[] => {
  return Array.isArray(data);
};

// Check if wardrobe item is newly created (within last 5 minutes)
const isNewlyCreatedItem = (createdAt: string): boolean => {
  const creationTime = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  
  return creationTime > fiveMinutesAgo;
};

export const triggerEnhancedAIImageGeneration = async (
  wardrobeItemId: string, 
  provider: ImageProvider = 'enhanced_thenewblack'
): Promise<void> => {
  try {
    console.log(`🚀 Starting ENHANCED AI generation for wardrobe item: ${wardrobeItemId} with professional quality`);

    // Get the wardrobe item data
    const { data: wardrobeItem, error } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items, image_url, cropped_images, created_at')
      .eq('id', wardrobeItemId)
      .single();

    if (error) {
      console.error('❌ Error fetching wardrobe item for enhanced AI generation:', error);
      return;
    }

    // PROTECTION: Only allow AI generation for newly created wardrobe items
    if (!isNewlyCreatedItem(wardrobeItem.created_at)) {
      console.log(`🚫 Skipping enhanced AI generation for existing wardrobe item ${wardrobeItemId}`);
      console.log('✅ Enhanced AI generation is only applied to newly uploaded outfits');
      return;
    }

    console.log(`✅ Wardrobe item ${wardrobeItemId} is newly created, proceeding with ENHANCED AI generation`);

    if (!wardrobeItem?.extracted_clothing_items) {
      console.log('⚠️ No extracted clothing items found for enhanced AI generation');
      return;
    }

    const extractedItems = wardrobeItem.extracted_clothing_items;
    if (!isClothingItemsArray(extractedItems)) {
      console.log('⚠️ Extracted clothing items is not an array');
      return;
    }

    const croppedImages = wardrobeItem.cropped_images;
    const croppedImagesArray = isCroppedImagesArray(croppedImages) ? croppedImages : [];

    // Filter out items that already have render images
    const itemsNeedingImages = extractedItems.filter(
      (item: any) => {
        if (item?.renderImageUrl) {
          console.log(`⏭️ Skipping item "${item.name}" - already has enhanced render image`);
          return false;
        }
        return true;
      }
    );

    if (itemsNeedingImages.length === 0) {
      console.log('✅ All clothing items already have enhanced render images');
      return;
    }

    console.log(`🎨 Generating ENHANCED professional images for ${itemsNeedingImages.length} items`);

    // Use enhanced generation system
    const config = {
      resolution: '1024x1024',
      quality: 'high' as const,
      style: 'ghost_mannequin' as const,
      background: 'white' as const,
      variants: 1,
      temperature: 0.3,
      provider: provider.includes('thenewblack') ? 'thenewblack' as const : 'openai' as const
    };

    enhancedClothingImageGenerator.batchGenerateImages(
      wardrobeItemId,
      extractedItems,
      config,
      wardrobeItem.image_url
    ).then(result => {
      console.log(`🎯 Enhanced AI generation completed: ${result.success}/${result.success + result.failed} successful`);
    }).catch(error => {
      console.error('❌ Enhanced AI generation failed:', error);
    });

    console.log(`🔄 Enhanced AI generation started with professional parameters`);

  } catch (error) {
    console.error('❌ Error triggering enhanced AI image generation:', error);
  }
};

// Legacy compatibility - now uses enhanced system
export const triggerAIImageGeneration = async (
  wardrobeItemId: string, 
  provider: ImageProvider = 'enhanced_thenewblack'
): Promise<void> => {
  return triggerEnhancedAIImageGeneration(wardrobeItemId, provider);
};

// Helper function to check if an item needs an AI image
export const itemNeedsRenderImage = (item: any): boolean => {
  return !item?.renderImageUrl && item?.name;
};

// Enhanced function to get the best available image URL
export const getRenderImageUrl = (item: any, originalImageUrl?: string): string | undefined => {
  // Priority: Enhanced AI > Regular AI > Cropped > Original
  if (item?.renderImageUrl) {
    return item.renderImageUrl;
  }
  
  if (item?.croppedImageUrl) {
    return item.croppedImageUrl;
  }
  
  return originalImageUrl;
};

// Enhanced function to get image type metadata with quality indicators
export const getImageTypeMetadata = (item: any): {
  type: 'enhanced_ai' | 'ai_generated' | 'cropped_original' | 'original' | 'placeholder';
  provider?: string;
  quality?: string;
  confidence?: number;
  processingTime?: number;
} => {
  if (item?.renderImageUrl) {
    const isEnhanced = item?.renderImageProvider?.includes('enhanced');
    return {
      type: isEnhanced ? 'enhanced_ai' : 'ai_generated',
      provider: item?.renderImageProvider || 'unknown',
      quality: item?.renderImageQuality || 'standard',
      processingTime: item?.renderImageProcessingTime
    };
  }
  
  if (item?.croppedImageUrl) {
    return {
      type: 'cropped_original',
      confidence: item?.croppingConfidence
    };
  }
  
  if (item?.originalImageUrl) {
    return { type: 'original' };
  }
  
  return { type: 'placeholder' };
};

// Polling function to check for updates instead of real-time subscriptions
export const pollWardrobeItemUpdates = async (wardrobeItemId: string): Promise<any | null> => {
  try {
    const { data: wardrobeItem, error } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items, cropped_images')
      .eq('id', wardrobeItemId)
      .single();

    if (error) {
      console.error('❌ Error polling wardrobe item:', error);
      return null;
    }

    return wardrobeItem;
  } catch (error) {
    console.error('❌ Error polling wardrobe item:', error);
    return null;
  }
};

export const batchProcessWardrobeItems = async (
  wardrobeItemIds: string[],
  provider: ImageProvider = 'enhanced_thenewblack'
): Promise<{ success: number; failed: number; skipped: number }> => {
  console.log(`🚀 Starting enhanced batch processing for ${wardrobeItemIds.length} wardrobe items`);
  
  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const itemId of wardrobeItemIds) {
    try {
      const { data: wardrobeItem, error } = await supabase
        .from('wardrobe_items')
        .select('created_at')
        .eq('id', itemId)
        .single();

      if (error || !isNewlyCreatedItem(wardrobeItem.created_at)) {
        console.log(`🚫 Skipping existing wardrobe item ${itemId} from enhanced batch processing`);
        skipped++;
        continue;
      }

      await triggerEnhancedAIImageGeneration(itemId, provider);
      success++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Failed to process wardrobe item ${itemId}:`, error);
      failed++;
    }
  }

  console.log(`✅ Enhanced batch processing completed: ${success} success, ${failed} failed, ${skipped} skipped`);
  return { success, failed, skipped };
};

export const checkGenerationProgress = async (wardrobeItemId: string): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  enhanced: number;
}> => {
  try {
    const { data: wardrobeItem, error } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items')
      .eq('id', wardrobeItemId)
      .single();

    if (error || !wardrobeItem?.extracted_clothing_items) {
      return { total: 0, completed: 0, inProgress: 0, failed: 0, enhanced: 0 };
    }

    const items = wardrobeItem.extracted_clothing_items as any[];
    const total = items.length;
    const completed = items.filter(item => item?.renderImageUrl).length;
    const enhanced = items.filter(item => 
      item?.renderImageProvider?.includes('enhanced')
    ).length;
    const failed = items.filter(item => item?.renderImageError).length;
    const inProgress = total - completed - failed;

    return { total, completed, inProgress, failed, enhanced };
  } catch (error) {
    console.error('❌ Error checking enhanced generation progress:', error);
    return { total: 0, completed: 0, inProgress: 0, failed: 0, enhanced: 0 };
  }
};
