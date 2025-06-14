
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export const generateClothingImage = async (
  itemName: string,
  wardrobeItemId: string,
  arrayIndex: number
): Promise<GenerateImageResult> => {
  try {
    console.log(`🎨 Starting AI image generation for: "${itemName}" [${wardrobeItemId}:${arrayIndex}]`);

    const { data, error } = await supabase.functions.invoke('generate-clothing-image', {
      body: {
        itemName,
        wardrobeItemId,
        arrayIndex
      }
    });

    if (error) {
      console.error('❌ Edge function invocation error:', error);
      toast.error(`Failed to generate image for ${itemName}: ${error.message}`);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      console.error('❌ Image generation failed:', data?.error);
      const errorMessage = data?.error || 'Unknown error during image generation';
      toast.error(`Image generation failed for ${itemName}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    console.log(`✅ AI image generated successfully for "${itemName}": ${data.imageUrl}`);
    toast.success(`Generated AI image for ${itemName}`);
    return { success: true, imageUrl: data.imageUrl };

  } catch (error) {
    console.error('❌ AI image generation service error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`Failed to generate image for ${itemName}: ${errorMessage}`);
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

export const updateWardrobeItemWithRenderImage = async (
  wardrobeItemId: string,
  arrayIndex: number,
  renderImageUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`💾 Updating wardrobe item ${wardrobeItemId}[${arrayIndex}] with render image`);

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
        renderImageGeneratedAt: new Date().toISOString()
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

      console.log(`✅ Successfully updated wardrobe item ${wardrobeItemId}[${arrayIndex}] with render image`);
      return { success: true };
    } else {
      console.error('❌ Invalid array index or item is not an object:', { arrayIndex, item: updatedItems[arrayIndex] });
      return { success: false, error: 'Invalid array index or item format' };
    }

  } catch (error) {
    console.error('❌ Error updating wardrobe item with render image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const generateImagesForClothingItems = async (
  wardrobeItemId: string,
  clothingItems: any[]
): Promise<void> => {
  if (!clothingItems || clothingItems.length === 0) {
    console.log('⚠️ No clothing items to process for AI image generation');
    return;
  }

  console.log(`🔄 Starting AI image generation for ${clothingItems.length} clothing items`);
  toast.info(`Generating AI images for ${clothingItems.length} clothing items...`);

  let successCount = 0;
  let failureCount = 0;

  // Process items with controlled concurrency (2 at a time to avoid rate limits)
  const batchSize = 2;
  for (let i = 0; i < clothingItems.length; i += batchSize) {
    const batch = clothingItems.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (item, batchIndex) => {
      const arrayIndex = i + batchIndex;
      
      if (!item?.name) {
        console.warn(`⚠️ Skipping item at index ${arrayIndex} - no name provided`);
        return;
      }

      // Skip if this item already has a render image
      if (item.renderImageUrl) {
        console.log(`⏭️ Skipping "${item.name}" - already has render image`);
        return;
      }

      try {
        console.log(`🎨 Processing ${arrayIndex + 1}/${clothingItems.length}: "${item.name}"`);

        const result = await generateClothingImage(item.name, wardrobeItemId, arrayIndex);
        
        if (result.success && result.imageUrl) {
          const updateResult = await updateWardrobeItemWithRenderImage(wardrobeItemId, arrayIndex, result.imageUrl);
          if (updateResult.success) {
            console.log(`✅ Successfully generated and saved render image for "${item.name}"`);
            successCount++;
          } else {
            console.error(`❌ Failed to save render image for "${item.name}":`, updateResult.error);
            failureCount++;
          }
        } else {
          console.warn(`⚠️ Failed to generate image for "${item.name}":`, result.error);
          failureCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing item "${item.name}":`, error);
        failureCount++;
      }
    });

    // Wait for the current batch to complete
    await Promise.allSettled(batchPromises);
    
    // Add a delay between batches to be respectful to the API
    if (i + batchSize < clothingItems.length) {
      console.log('⏸️ Pausing between batches...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const totalProcessed = successCount + failureCount;
  console.log(`🎯 AI image generation completed: ${successCount}/${totalProcessed} successful`);
  
  if (successCount > 0) {
    toast.success(`Generated ${successCount} AI images successfully!`);
  }
  
  if (failureCount > 0) {
    toast.warning(`${failureCount} images failed to generate. Check console for details.`);
  }
};
