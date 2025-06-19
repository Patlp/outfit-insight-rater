
import { generateImagesForClothingItems } from '@/services/clothing/aiImageGeneration';
import { generateTheNewBlackImagesForClothingItems } from '@/services/clothing/theNewBlackIntegration';
import { supabase } from '@/integrations/supabase/client';

type ImageProvider = 'openai' | 'thenewblack';

export const triggerAIImageGeneration = async (
  wardrobeItemId: string, 
  provider: ImageProvider = 'thenewblack'
): Promise<void> => {
  try {
    console.log(`🚀 Triggering AI image generation for wardrobe item: ${wardrobeItemId} using ${provider}`);

    // Get the wardrobe item with its extracted clothing items and original image
    const { data: wardrobeItem, error } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items, image_url, cropped_images')
      .eq('id', wardrobeItemId)
      .single();

    if (error) {
      console.error('❌ Error fetching wardrobe item for AI generation:', error);
      return;
    }

    if (!wardrobeItem?.extracted_clothing_items || !Array.isArray(wardrobeItem.extracted_clothing_items)) {
      console.log('⚠️ No extracted clothing items found for AI generation');
      return;
    }

    // Filter out items that already have render images
    const itemsNeedingImages = wardrobeItem.extracted_clothing_items.filter(
      (item: any, index: number) => !item?.renderImageUrl
    );

    if (itemsNeedingImages.length === 0) {
      console.log('✅ All clothing items already have render images');
      return;
    }

    console.log(`🎨 Generating AI images for ${itemsNeedingImages.length} items using ${provider}`);

    // Choose the appropriate generation method based on provider
    if (provider === 'thenewblack') {
      // Use TheNewBlack Ghost Mannequin API with enhanced context
      generateTheNewBlackImagesForClothingItems(
        wardrobeItemId, 
        wardrobeItem.extracted_clothing_items,
        wardrobeItem.image_url,
        wardrobeItem.cropped_images
      ).catch(error => {
        console.error('❌ Background TheNewBlack image generation failed:', error);
      });
    } else {
      // Fallback to OpenAI DALL-E
      generateImagesForClothingItems(wardrobeItemId, wardrobeItem.extracted_clothing_items)
        .catch(error => {
          console.error('❌ Background OpenAI image generation failed:', error);
        });
    }

    console.log(`🔄 AI image generation started in background using ${provider}`);

  } catch (error) {
    console.error('❌ Error triggering AI image generation:', error);
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
