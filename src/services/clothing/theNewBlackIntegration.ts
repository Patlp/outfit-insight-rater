
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TheNewBlackGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export const generateTheNewBlackImage = async (
  itemName: string,
  wardrobeItemId: string,
  arrayIndex: number,
  originalImageUrl?: string
): Promise<TheNewBlackGenerationResult> => {
  try {
    console.log(`🎨 Starting TheNewBlack generation for: "${itemName}" [${wardrobeItemId}:${arrayIndex}]`);

    const { data, error } = await supabase.functions.invoke('generate-thenewblack-image', {
      body: {
        itemName,
        wardrobeItemId,
        arrayIndex,
        originalImageUrl
      }
    });

    if (error) {
      console.error('❌ TheNewBlack edge function error:', error);
      toast.error(`Failed to generate TheNewBlack image for ${itemName}: ${error.message}`);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      console.error('❌ TheNewBlack generation failed:', data?.error);
      const errorMessage = data?.error || 'Unknown error during TheNewBlack generation';
      toast.error(`TheNewBlack generation failed for ${itemName}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    console.log(`✅ TheNewBlack image generated successfully for "${itemName}": ${data.imageUrl}`);
    toast.success(`Generated professional image for ${itemName} using TheNewBlack`);
    return { success: true, imageUrl: data.imageUrl };

  } catch (error) {
    console.error('❌ TheNewBlack generation service error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`Failed to generate TheNewBlack image for ${itemName}: ${errorMessage}`);
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

export const generateTheNewBlackImagesForClothingItems = async (
  wardrobeItemId: string,
  clothingItems: any[],
  originalImageUrl?: string
): Promise<void> => {
  if (!clothingItems || clothingItems.length === 0) {
    console.log('⚠️ No clothing items to process for TheNewBlack generation');
    return;
  }

  console.log(`🔄 Starting TheNewBlack generation for ${clothingItems.length} clothing items`);
  toast.info(`Generating professional images for ${clothingItems.length} items using TheNewBlack...`);

  let successCount = 0;
  let failureCount = 0;

  // Process items sequentially to avoid API rate limits
  for (let i = 0; i < clothingItems.length; i++) {
    const item = clothingItems[i];
    
    try {
      if (!item?.name) {
        console.warn(`⚠️ Skipping item at index ${i} - no name provided`);
        continue;
      }

      // Skip if this item already has a render image
      if (item.renderImageUrl) {
        console.log(`⏭️ Skipping "${item.name}" - already has render image`);
        continue;
      }

      console.log(`🎨 Processing ${i + 1}/${clothingItems.length}: "${item.name}"`);

      const result = await generateTheNewBlackImage(
        item.name, 
        wardrobeItemId, 
        i, 
        originalImageUrl
      );
      
      if (result.success && result.imageUrl) {
        // Update the wardrobe item with the new render image
        const updateResult = await updateWardrobeItemWithRenderImage(wardrobeItemId, i, result.imageUrl);
        
        if (updateResult.success) {
          console.log(`✅ Successfully generated and saved TheNewBlack image for "${item.name}"`);
          successCount++;
        } else {
          console.error(`❌ Failed to save TheNewBlack image for "${item.name}":`, updateResult.error);
          failureCount++;
        }
      } else {
        console.warn(`⚠️ Failed to generate TheNewBlack image for "${item.name}":`, result.error);
        failureCount++;
      }

      // Add delay between requests to be respectful to the API
      if (i < clothingItems.length - 1) {
        console.log('⏸️ Pausing between requests...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
      }

    } catch (error) {
      console.error(`❌ Error processing item "${item.name}":`, error);
      failureCount++;
    }
  }

  const totalProcessed = successCount + failureCount;
  console.log(`🎯 TheNewBlack generation completed: ${successCount}/${totalProcessed} successful`);
  
  if (successCount > 0) {
    toast.success(`Generated ${successCount} professional images using TheNewBlack!`);
  }
  
  if (failureCount > 0) {
    toast.warning(`${failureCount} images failed to generate. Check console for details.`);
  }
};

// Helper function to update wardrobe item with render image
const updateWardrobeItemWithRenderImage = async (
  wardrobeItemId: string,
  arrayIndex: number,
  renderImageUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`💾 Updating wardrobe item ${wardrobeItemId}[${arrayIndex}] with TheNewBlack render image`);

    // First, get the current wardrobe item
    const { data: wardrobeItem, error: fetchError } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items')
      .eq('id', wardrobeItemId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching wardrobe item:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!wardrobeItem?.extracted_clothing_items || !Array.isArray(wardrobeItem.extracted_clothing_items)) {
      console.error('❌ No extracted clothing items found or invalid format');
      return { success: false, error: 'No extracted clothing items found' };
    }

    // Update the specific clothing item with the render image URL
    const updatedItems = Array.from(wardrobeItem.extracted_clothing_items);
    if (updatedItems[arrayIndex] && typeof updatedItems[arrayIndex] === 'object') {
      updatedItems[arrayIndex] = {
        ...(updatedItems[arrayIndex] as Record<string, any>),
        renderImageUrl,
        renderImageGeneratedAt: new Date().toISOString(),
        renderImageProvider: 'thenewblack'
      };

      // Update the database
      const { error: updateError } = await supabase
        .from('wardrobe_items')
        .update({
          extracted_clothing_items: updatedItems,
          updated_at: new Date().toISOString()
        })
        .eq('id', wardrobeItemId);

      if (updateError) {
        console.error('❌ Error updating wardrobe item:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log(`✅ Successfully updated wardrobe item ${wardrobeItemId}[${arrayIndex}] with TheNewBlack render image`);
      return { success: true };
    } else {
      console.error('❌ Invalid array index or item is not an object:', { arrayIndex, item: updatedItems[arrayIndex] });
      return { success: false, error: 'Invalid array index or item format' };
    }

  } catch (error) {
    console.error('❌ Error updating wardrobe item with TheNewBlack render image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
