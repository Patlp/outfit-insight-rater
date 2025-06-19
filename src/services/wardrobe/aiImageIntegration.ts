import { contextAwareImageGenerator } from '@/services/clothing/contextAwareImageGeneration';
import { supabase } from '@/integrations/supabase/client';

type ImageProvider = 'context_aware_openai' | 'enhanced_openai' | 'openai';

// Type guard to check if Json is an array of clothing items
const isClothingItemsArray = (data: any): data is any[] => {
  return Array.isArray(data);
};

// Check if wardrobe item is newly created (within last 5 minutes)
const isNewlyCreatedItem = (createdAt: string): boolean => {
  const creationTime = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  
  return creationTime > fiveMinutesAgo;
};

export const triggerContextAwareAIImageGeneration = async (
  wardrobeItemId: string, 
  provider: ImageProvider = 'context_aware_openai'
): Promise<void> => {
  try {
    console.log(`🚀 Starting CONTEXT-AWARE AI generation for wardrobe item: ${wardrobeItemId} with maximum accuracy`);

    // Get the wardrobe item data
    const { data: wardrobeItem, error } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items, image_url, cropped_images, created_at')
      .eq('id', wardrobeItemId)
      .single();

    if (error) {
      console.error('❌ Error fetching wardrobe item for context-aware AI generation:', error);
      return;
    }

    // PROTECTION: Only allow AI generation for newly created wardrobe items
    if (!isNewlyCreatedItem(wardrobeItem.created_at)) {
      console.log(`🚫 Skipping context-aware AI generation for existing wardrobe item ${wardrobeItemId}`);
      console.log('✅ Context-aware AI generation is only applied to newly uploaded outfits');
      return;
    }

    console.log(`✅ Wardrobe item ${wardrobeItemId} is newly created, proceeding with CONTEXT-AWARE AI generation`);

    if (!wardrobeItem?.extracted_clothing_items) {
      console.log('⚠️ No extracted clothing items found for context-aware AI generation');
      return;
    }

    const extractedItems = wardrobeItem.extracted_clothing_items;
    if (!isClothingItemsArray(extractedItems)) {
      console.log('⚠️ Extracted clothing items is not an array');
      return;
    }

    // Filter out items that already have render images
    const itemsNeedingImages = extractedItems.filter(
      (item: any) => {
        if (item?.renderImageUrl) {
          console.log(`⏭️ Skipping item "${item.name}" - already has render image`);
          return false;
        }
        return true;
      }
    );

    if (itemsNeedingImages.length === 0) {
      console.log('✅ All clothing items already have render images');
      return;
    }

    console.log(`🎯 Generating CONTEXT-AWARE accurate images for ${itemsNeedingImages.length} items`);

    // Use context-aware generation system for maximum accuracy
    const config = {
      resolution: '1024x1024',
      quality: 'high' as const,
      style: 'product_photography' as const,
      useTaxonomy: true,
      useVisionTags: true,
      enhancePrompts: true
    };

    contextAwareImageGenerator.batchGenerateContextualImages(
      wardrobeItemId,
      extractedItems,
      wardrobeItem.image_url,
      config
    ).then(result => {
      console.log(`🎯 Context-aware AI generation completed: ${result.success}/${result.success + result.failed} successful`);
    }).catch(error => {
      console.error('❌ Context-aware AI generation failed:', error);
    });

    console.log(`🔄 Context-aware AI generation started with maximum accuracy parameters`);

  } catch (error) {
    console.error('❌ Error triggering context-aware AI image generation:', error);
  }
};

// Updated main function to use context-aware generation
export const triggerEnhancedAIImageGeneration = async (
  wardrobeItemId: string, 
  provider: ImageProvider = 'context_aware_openai'
): Promise<void> => {
  return triggerContextAwareAIImageGeneration(wardrobeItemId, provider);
};

// Legacy compatibility - now uses context-aware system
export const triggerAIImageGeneration = async (
  wardrobeItemId: string, 
  provider: ImageProvider = 'context_aware_openai'
): Promise<void> => {
  return triggerContextAwareAIImageGeneration(wardrobeItemId, provider);
};

// Helper function to check if an item needs an AI image
export const itemNeedsRenderImage = (item: any): boolean => {
  return !item?.renderImageUrl && item?.name;
};

// Enhanced function to get the best available image URL
export const getRenderImageUrl = (item: any, originalImageUrl?: string): string | undefined => {
  // Priority: Context-aware AI > Enhanced AI > Regular AI > Cropped > Original
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
  type: 'context_aware_ai' | 'enhanced_ai' | 'ai_generated' | 'cropped_original' | 'original' | 'placeholder';
  provider?: string;
  quality?: string;
  confidence?: number;
  processingTime?: number;
  accuracy?: string;
} => {
  if (item?.renderImageUrl) {
    const isContextAware = item?.renderImageProvider?.includes('context_aware');
    const isEnhanced = item?.renderImageProvider?.includes('enhanced');
    
    let type: 'context_aware_ai' | 'enhanced_ai' | 'ai_generated' = 'ai_generated';
    let accuracy = 'standard';
    
    if (isContextAware) {
      type = 'context_aware_ai';
      accuracy = 'high';
    } else if (isEnhanced) {
      type = 'enhanced_ai';
      accuracy = 'medium';
    }
    
    return {
      type,
      provider: item?.renderImageProvider || 'unknown',
      quality: item?.renderImageQuality || 'standard',
      processingTime: item?.renderImageProcessingTime,
      accuracy
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
  provider: ImageProvider = 'context_aware_openai'
): Promise<{ success: number; failed: number; skipped: number }> => {
  console.log(`🚀 Starting context-aware batch processing for ${wardrobeItemIds.length} wardrobe items`);
  
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
        console.log(`🚫 Skipping existing wardrobe item ${itemId} from context-aware batch processing`);
        skipped++;
        continue;
      }

      await triggerContextAwareAIImageGeneration(itemId, provider);
      success++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Failed to process wardrobe item ${itemId}:`, error);
      failed++;
    }
  }

  console.log(`✅ Context-aware batch processing completed: ${success} success, ${failed} failed, ${skipped} skipped`);
  return { success, failed, skipped };
};

export const checkGenerationProgress = async (wardrobeItemId: string): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  contextAware: number;
}> => {
  try {
    const { data: wardrobeItem, error } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items')
      .eq('id', wardrobeItemId)
      .single();

    if (error || !wardrobeItem?.extracted_clothing_items) {
      return { total: 0, completed: 0, inProgress: 0, failed: 0, contextAware: 0 };
    }

    const items = wardrobeItem.extracted_clothing_items as any[];
    const total = items.length;
    const completed = items.filter(item => item?.renderImageUrl).length;
    const contextAware = items.filter(item => 
      item?.renderImageProvider?.includes('context_aware')
    ).length;
    const failed = items.filter(item => item?.renderImageError).length;
    const inProgress = total - completed - failed;

    return { total, completed, inProgress, failed, contextAware };
  } catch (error) {
    console.error('❌ Error checking context-aware generation progress:', error);
    return { total: 0, completed: 0, inProgress: 0, failed: 0, contextAware: 0 };
  }
};
