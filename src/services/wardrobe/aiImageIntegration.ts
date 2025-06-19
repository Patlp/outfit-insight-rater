import { generateImagesForClothingItems } from '@/services/clothing/aiImageGeneration';
import { generateTheNewBlackImagesForClothingItems } from '@/services/clothing/theNewBlackIntegration';
import { supabase } from '@/integrations/supabase/client';

type ImageProvider = 'openai' | 'thenewblack';

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
  const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutes in milliseconds
  
  return creationTime > fiveMinutesAgo;
};

export const triggerAIImageGeneration = async (
  wardrobeItemId: string, 
  provider: ImageProvider = 'thenewblack'
): Promise<void> => {
  try {
    console.log(`🚀 Starting enhanced AI image generation for wardrobe item: ${wardrobeItemId} with improved API integration`);

    // Get the wardrobe item with its extracted clothing items, original image, and creation timestamp
    const { data: wardrobeItem, error } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items, image_url, cropped_images, created_at')
      .eq('id', wardrobeItemId)
      .single();

    if (error) {
      console.error('❌ Error fetching wardrobe item for AI generation:', error);
      return;
    }

    // PROTECTION: Only allow AI generation for newly created wardrobe items
    if (!isNewlyCreatedItem(wardrobeItem.created_at)) {
      console.log(`🚫 Skipping AI generation for existing wardrobe item ${wardrobeItemId} (created: ${wardrobeItem.created_at})`);
      console.log('✅ AI image generation is only applied to newly uploaded outfits');
      return;
    }

    console.log(`✅ Wardrobe item ${wardrobeItemId} is newly created, proceeding with AI generation`);

    if (!wardrobeItem?.extracted_clothing_items) {
      console.log('⚠️ No extracted clothing items found for AI generation');
      return;
    }

    // Type guard and cast the Json type to array
    const extractedItems = wardrobeItem.extracted_clothing_items;
    if (!isClothingItemsArray(extractedItems)) {
      console.log('⚠️ Extracted clothing items is not an array');
      return;
    }

    // Type guard for cropped images
    const croppedImages = wardrobeItem.cropped_images;
    const croppedImagesArray = isCroppedImagesArray(croppedImages) ? croppedImages : [];

    // ADDITIONAL PROTECTION: Filter out items that already have render images
    const itemsNeedingImages = extractedItems.filter(
      (item: any, index: number) => {
        if (item?.renderImageUrl) {
          console.log(`⏭️ Skipping item "${item.name}" - already has AI render image`);
          return false;
        }
        return true;
      }
    );

    if (itemsNeedingImages.length === 0) {
      console.log('✅ All clothing items already have render images, no generation needed');
      return;
    }

    console.log(`🎨 Generating AI images for ${itemsNeedingImages.length} items using enhanced ${provider} integration`);

    // Choose the appropriate generation method based on provider
    if (provider === 'thenewblack') {
      // Use enhanced TheNewBlack API with improved authentication and validation
      console.log('🔑 Using enhanced TheNewBlack API with improved authentication, endpoint discovery, and fallback mechanisms');
      generateTheNewBlackImagesForClothingItems(
        wardrobeItemId, 
        extractedItems,
        wardrobeItem.image_url,
        croppedImagesArray
      ).catch(error => {
        console.error('❌ Enhanced TheNewBlack image generation failed:', error);
      });
    } else {
      // Fallback to OpenAI DALL-E
      generateImagesForClothingItems(wardrobeItemId, extractedItems)
        .catch(error => {
          console.error('❌ OpenAI image generation failed:', error);
        });
    }

    console.log(`🔄 Enhanced AI image generation started in background using ${provider} with comprehensive error handling`);

  } catch (error) {
    console.error('❌ Error triggering enhanced AI image generation:', error);
  }
};

// Helper function to check if an item needs an AI image
export const itemNeedsRenderImage = (item: any): boolean => {
  return !item?.renderImageUrl && item?.name;
};

// Enhanced function to get the best available image URL
export const getRenderImageUrl = (item: any, originalImageUrl?: string): string | undefined => {
  // Priority order: AI render image > cropped image > original image
  if (item?.renderImageUrl) {
    return item.renderImageUrl;
  }
  
  if (item?.croppedImageUrl) {
    return item.croppedImageUrl;
  }
  
  // Fallback to original image
  return originalImageUrl;
};

// Enhanced function to get image type metadata
export const getImageTypeMetadata = (item: any): {
  type: 'ai_generated' | 'cropped_original' | 'original' | 'placeholder';
  provider?: string;
  confidence?: number;
} => {
  if (item?.renderImageUrl) {
    return {
      type: 'ai_generated',
      provider: item?.renderImageProvider || 'unknown'
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

// Enhanced batch processing function for multiple wardrobe items - ONLY for newly created items
export const batchProcessWardrobeItems = async (
  wardrobeItemIds: string[],
  provider: ImageProvider = 'thenewblack'
): Promise<{ success: number; failed: number; skipped: number }> => {
  console.log(`🚀 Starting batch processing for ${wardrobeItemIds.length} wardrobe items (new uploads only)`);
  
  let success = 0;
  let failed = 0;
  let skipped = 0;

  // Process items sequentially to avoid overwhelming the APIs
  for (const itemId of wardrobeItemIds) {
    try {
      // Check if this is a newly created item before processing
      const { data: wardrobeItem, error } = await supabase
        .from('wardrobe_items')
        .select('created_at')
        .eq('id', itemId)
        .single();

      if (error || !isNewlyCreatedItem(wardrobeItem.created_at)) {
        console.log(`🚫 Skipping existing wardrobe item ${itemId} from batch processing`);
        skipped++;
        continue;
      }

      await triggerAIImageGeneration(itemId, provider);
      success++;
      // Small delay between items
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Failed to process wardrobe item ${itemId}:`, error);
      failed++;
    }
  }

  console.log(`✅ Batch processing completed: ${success} success, ${failed} failed, ${skipped} skipped (existing items)`);
  return { success, failed, skipped };
};

// Function to check generation status across multiple items
export const checkGenerationProgress = async (wardrobeItemId: string): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
}> => {
  try {
    const { data: wardrobeItem, error } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items')
      .eq('id', wardrobeItemId)
      .single();

    if (error || !wardrobeItem?.extracted_clothing_items) {
      return { total: 0, completed: 0, inProgress: 0, failed: 0 };
    }

    const items = wardrobeItem.extracted_clothing_items as any[];
    const total = items.length;
    const completed = items.filter(item => item?.renderImageUrl).length;
    const failed = items.filter(item => item?.renderImageError).length;
    const inProgress = total - completed - failed;

    return { total, completed, inProgress, failed };
  } catch (error) {
    console.error('❌ Error checking generation progress:', error);
    return { total: 0, completed: 0, inProgress: 0, failed: 0 };
  }
};
