
import { generateImagesForClothingItems } from '@/services/clothing/aiImageGeneration';
import { supabase } from '@/integrations/supabase/client';

export const triggerAIImageGeneration = async (wardrobeItemId: string): Promise<void> => {
  try {
    console.log(`🚀 Triggering AI image generation for wardrobe item: ${wardrobeItemId}`);

    // Get the wardrobe item with its extracted clothing items
    const { data: wardrobeItem, error } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items')
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

    console.log(`🎨 Generating AI images for ${itemsNeedingImages.length} items`);

    // Start the image generation process in the background
    // We don't await this to avoid blocking the main flow
    generateImagesForClothingItems(wardrobeItemId, wardrobeItem.extracted_clothing_items)
      .catch(error => {
        console.error('❌ Background AI image generation failed:', error);
      });

    console.log('🔄 AI image generation started in background');

  } catch (error) {
    console.error('❌ Error triggering AI image generation:', error);
  }
};

// Helper function to check if an item needs an AI image
export const itemNeedsRenderImage = (item: any): boolean => {
  return !item?.renderImageUrl && item?.name;
};

// Helper function to get the render image URL or fallback
export const getRenderImageUrl = (item: any, originalImageUrl?: string): string | undefined => {
  if (item?.renderImageUrl) {
    return item.renderImageUrl;
  }
  
  // Fallback to original image or placeholder
  return originalImageUrl;
};
