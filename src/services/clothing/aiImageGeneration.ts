
import { supabase } from '@/integrations/supabase/client';

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
    console.log(`🎨 Starting AI image generation for: "${itemName}"`);

    const { data, error } = await supabase.functions.invoke('generate-clothing-image', {
      body: {
        itemName,
        wardrobeItemId,
        arrayIndex
      }
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      console.error('❌ Image generation failed:', data?.error);
      return { success: false, error: data?.error || 'Unknown error' };
    }

    console.log(`✅ AI image generated successfully: ${data.imageUrl}`);
    return { success: true, imageUrl: data.imageUrl };

  } catch (error) {
    console.error('❌ AI image generation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const updateWardrobeItemWithRenderImage = async (
  wardrobeItemId: string,
  arrayIndex: number,
  renderImageUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
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
      return { success: false, error: 'No extracted clothing items found' };
    }

    // Update the specific clothing item with the render image URL
    const updatedItems = [...wardrobeItem.extracted_clothing_items];
    if (updatedItems[arrayIndex]) {
      updatedItems[arrayIndex] = {
        ...updatedItems[arrayIndex],
        renderImageUrl
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

      console.log(`✅ Updated wardrobe item ${wardrobeItemId} with render image`);
      return { success: true };
    } else {
      return { success: false, error: 'Invalid array index' };
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
  console.log(`🔄 Generating AI images for ${clothingItems.length} clothing items`);

  // Process items sequentially to avoid API rate limits
  for (let i = 0; i < clothingItems.length; i++) {
    const item = clothingItems[i];
    if (!item?.name) continue;

    try {
      console.log(`🎨 Generating image ${i + 1}/${clothingItems.length}: "${item.name}"`);

      const result = await generateClothingImage(item.name, wardrobeItemId, i);
      
      if (result.success && result.imageUrl) {
        await updateWardrobeItemWithRenderImage(wardrobeItemId, i, result.imageUrl);
        console.log(`✅ Successfully generated and saved render image for "${item.name}"`);
      } else {
        console.warn(`⚠️ Failed to generate image for "${item.name}":`, result.error);
      }

      // Add a small delay between requests to be nice to the API
      if (i < clothingItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ Error processing item "${item.name}":`, error);
    }
  }

  console.log(`✅ Completed AI image generation for wardrobe item ${wardrobeItemId}`);
};
