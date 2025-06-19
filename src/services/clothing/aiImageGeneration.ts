
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

    // First check if this item already has a persisted AI image
    const { data: existingItem, error: fetchError } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items')
      .eq('id', wardrobeItemId)
      .single();

    if (!fetchError && existingItem?.extracted_clothing_items) {
      const clothingItems = existingItem.extracted_clothing_items as any[];
      const targetItem = clothingItems[arrayIndex];
      
      if (targetItem?.renderImageUrl && targetItem?.renderImageGeneratedAt) {
        const generatedAt = new Date(targetItem.renderImageGeneratedAt);
        const now = new Date();
        const daysDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60 * 24);
        
        // If image is less than 30 days old, use the existing one
        if (daysDiff <= 30) {
          console.log(`✅ Using existing persisted AI image for "${itemName}" (${daysDiff.toFixed(1)} days old)`);
          return { success: true, imageUrl: targetItem.renderImageUrl };
        } else {
          console.log(`⚠️ Existing AI image for "${itemName}" is expired (${daysDiff.toFixed(1)} days old), regenerating...`);
        }
      }
    }

    // Generate new AI image
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

    console.log(`✅ AI image generated and persisted successfully for "${itemName}": ${data.imageUrl}`);
    toast.success(`Generated and saved AI image for ${itemName}`);
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
    console.log(`💾 Persisting AI image for wardrobe item ${wardrobeItemId}[${arrayIndex}]`);

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

    // Update the specific clothing item with the render image URL and persistence metadata
    const updatedItems = Array.from(wardrobeItem.extracted_clothing_items);
    if (updatedItems[arrayIndex] && typeof updatedItems[arrayIndex] === 'object') {
      const currentTimestamp = new Date().toISOString();
      
      updatedItems[arrayIndex] = {
        ...(updatedItems[arrayIndex] as Record<string, any>),
        renderImageUrl,
        renderImageGeneratedAt: currentTimestamp,
        renderImageProvider: 'openai',
        imageType: 'ai_generated',
        persistedAt: currentTimestamp,
        isPersisted: true
      };

      // Update the database with persistence tracking
      const { error: updateError } = await supabase
        .from('wardrobe_items')
        .update({
          extracted_clothing_items: updatedItems,
          updated_at: currentTimestamp
        })
        .eq('id', wardrobeItemId);

      if (updateError) {
        console.error('❌ Error persisting AI image to database:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log(`✅ Successfully persisted AI image for wardrobe item ${wardrobeItemId}[${arrayIndex}]`);
      console.log(`💾 Image URL: ${renderImageUrl}`);
      console.log(`📅 Generated and persisted at: ${currentTimestamp}`);
      
      return { success: true };
    } else {
      console.error('❌ Invalid array index or item is not an object:', { arrayIndex, item: updatedItems[arrayIndex] });
      return { success: false, error: 'Invalid array index or item format' };
    }

  } catch (error) {
    console.error('❌ Error persisting AI image:', error);
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

  console.log(`🔄 Starting batch AI image generation with persistence for ${clothingItems.length} clothing items`);
  toast.info(`Generating and saving AI images for ${clothingItems.length} clothing items...`);

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

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

      // Check if this item already has a valid persisted render image
      if (item.renderImageUrl && item.renderImageGeneratedAt) {
        const generatedAt = new Date(item.renderImageGeneratedAt);
        const now = new Date();
        const daysDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= 30) {
          console.log(`⏭️ Skipping "${item.name}" - has valid persisted AI image (${daysDiff.toFixed(1)} days old)`);
          skippedCount++;
          return;
        }
      }

      try {
        console.log(`🎨 Processing ${arrayIndex + 1}/${clothingItems.length}: "${item.name}"`);

        const result = await generateClothingImage(item.name, wardrobeItemId, arrayIndex);
        
        if (result.success && result.imageUrl) {
          const updateResult = await updateWardrobeItemWithRenderImage(wardrobeItemId, arrayIndex, result.imageUrl);
          if (updateResult.success) {
            console.log(`✅ Successfully generated and persisted AI image for "${item.name}"`);
            successCount++;
          } else {
            console.error(`❌ Failed to persist AI image for "${item.name}":`, updateResult.error);
            failureCount++;
          }
        } else {
          console.warn(`⚠️ Failed to generate AI image for "${item.name}":`, result.error);
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

  const totalProcessed = successCount + failureCount + skippedCount;
  console.log(`🎯 Batch AI image generation completed: ${successCount} generated, ${skippedCount} skipped (already persisted), ${failureCount} failed`);
  
  if (successCount > 0) {
    toast.success(`Generated and saved ${successCount} new AI images!`);
  }
  
  if (skippedCount > 0) {
    toast.info(`${skippedCount} items already had saved AI images`);
  }
  
  if (failureCount > 0) {
    toast.warning(`${failureCount} images failed to generate. Check console for details.`);
  }
};
