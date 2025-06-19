
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TheNewBlackGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  fallbackToOpenAI?: boolean;
  debugInfo?: any;
}

export const generateTheNewBlackImage = async (
  itemName: string,
  wardrobeItemId: string,
  arrayIndex: number,
  originalImageUrl?: string,
  croppedImageUrl?: string
): Promise<TheNewBlackGenerationResult> => {
  try {
    console.log(`🎨 Starting Enhanced TheNewBlack generation for: "${itemName}" [${wardrobeItemId}:${arrayIndex}]`);

    // Use cropped image if available, otherwise fall back to original
    const imageToProcess = croppedImageUrl || originalImageUrl;
    
    if (croppedImageUrl) {
      console.log(`📸 Using cropped image for "${itemName}": ${croppedImageUrl}`);
    } else if (originalImageUrl) {
      console.log(`🖼️ Using original image for "${itemName}": ${originalImageUrl}`);
    }

    const { data, error } = await supabase.functions.invoke('generate-thenewblack-image', {
      body: {
        itemName,
        wardrobeItemId,
        arrayIndex,
        originalImageUrl: imageToProcess,
        useCroppedImage: !!croppedImageUrl
      }
    });

    if (error) {
      console.error('❌ TheNewBlack edge function error:', error);
      console.error('🔍 Debug info available:', data?.debugInfo);
      
      // Log network connectivity details if available
      if (data?.debugInfo?.networkConnectivity) {
        console.log('🌐 Network connectivity test results:', data.debugInfo.networkConnectivity);
      }
      
      // Check if we should fallback to OpenAI
      if (data?.fallbackToOpenAI) {
        console.log(`🔄 Falling back to OpenAI for "${itemName}" due to TheNewBlack connectivity issues`);
        toast.info(`TheNewBlack service unavailable for ${itemName}, using OpenAI instead...`);
        
        // Import and use OpenAI fallback
        const { generateClothingImage } = await import('./aiImageGeneration');
        return await generateClothingImage(itemName, wardrobeItemId, arrayIndex);
      }
      
      toast.error(`Failed to generate TheNewBlack image for ${itemName}: ${error.message}`);
      return { success: false, error: error.message, debugInfo: data?.debugInfo };
    }

    if (!data?.success) {
      console.error('❌ TheNewBlack generation failed:', data?.error);
      console.error('🔍 Debug info:', data?.debugInfo);
      
      const errorMessage = data?.error || 'Unknown error during TheNewBlack generation';
      
      // Check if we should fallback to OpenAI
      if (data?.fallbackToOpenAI) {
        console.log(`🔄 Falling back to OpenAI for "${itemName}" due to service issues`);
        toast.info(`TheNewBlack service issues for ${itemName}, using OpenAI instead...`);
        
        // Import and use OpenAI fallback
        const { generateClothingImage } = await import('./aiImageGeneration');
        return await generateClothingImage(itemName, wardrobeItemId, arrayIndex);
      }
      
      toast.error(`TheNewBlack generation failed for ${itemName}: ${errorMessage}`);
      return { success: false, error: errorMessage, debugInfo: data?.debugInfo };
    }

    console.log(`✅ Enhanced TheNewBlack image generated successfully for "${itemName}": ${data.imageUrl}`);
    
    // Log debug info for successful requests too
    if (data.debugInfo) {
      console.log('🔍 Success debug info:', {
        authEndpointsAttempted: data.debugInfo.authEndpointsAttempted,
        generationEndpointsAttempted: data.debugInfo.generationEndpointsAttempted,
        networkConnectivity: data.debugInfo.networkConnectivity,
        usedCroppedImage: !!croppedImageUrl
      });
    }
    
    const imageType = croppedImageUrl ? 'cropped image' : 'original image';
    toast.success(`Generated professional image for ${itemName} using TheNewBlack Ghost Mannequin (${imageType})`);
    return { success: true, imageUrl: data.imageUrl, debugInfo: data.debugInfo };

  } catch (error) {
    console.error('❌ TheNewBlack generation service error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Try OpenAI fallback on network errors
    console.log(`🔄 Network error, falling back to OpenAI for "${itemName}"`);
    toast.info(`Network error with TheNewBlack, trying OpenAI for ${itemName}...`);
    
    try {
      const { generateClothingImage } = await import('./aiImageGeneration');
      return await generateClothingImage(itemName, wardrobeItemId, arrayIndex);
    } catch (fallbackError) {
      console.error('❌ OpenAI fallback also failed:', fallbackError);
      toast.error(`Both TheNewBlack and OpenAI failed for ${itemName}`);
      return { 
        success: false, 
        error: `Both services failed: ${errorMessage}` 
      };
    }
  }
};

export const generateTheNewBlackImagesForClothingItems = async (
  wardrobeItemId: string,
  clothingItems: any[],
  originalImageUrl?: string,
  croppedImages?: any[]
): Promise<void> => {
  if (!clothingItems || clothingItems.length === 0) {
    console.log('⚠️ No clothing items to process for TheNewBlack generation');
    return;
  }

  console.log(`🔄 Starting TheNewBlack generation for ${clothingItems.length} clothing items`);
  console.log(`📸 Available cropped images: ${croppedImages?.length || 0}`);
  toast.info(`Generating professional images for ${clothingItems.length} items using AI...`);

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

      // Find matching cropped image for this item
      const matchingCroppedImage = croppedImages?.find(croppedImg => {
        const itemName = item.name?.toLowerCase() || '';
        const croppedName = croppedImg.item_name?.toLowerCase() || '';
        
        return itemName.includes(croppedName) || croppedName.includes(itemName) ||
               itemName.split(' ').some(word => croppedName.includes(word));
      });

      const croppedImageUrl = matchingCroppedImage?.cropped_image_url;
      if (croppedImageUrl) {
        console.log(`📸 Found cropped image for "${item.name}": ${croppedImageUrl}`);
      }

      const result = await generateTheNewBlackImage(
        item.name, 
        wardrobeItemId, 
        i, 
        originalImageUrl,
        croppedImageUrl
      );
      
      if (result.success && result.imageUrl) {
        // Update the wardrobe item with the new render image
        const updateResult = await updateWardrobeItemWithRenderImage(wardrobeItemId, i, result.imageUrl, !!croppedImageUrl);
        
        if (updateResult.success) {
          console.log(`✅ Successfully generated and saved AI image for "${item.name}"`);
          successCount++;
        } else {
          console.error(`❌ Failed to save AI image for "${item.name}":`, updateResult.error);
          failureCount++;
        }
      } else {
        console.warn(`⚠️ Failed to generate AI image for "${item.name}":`, result.error);
        failureCount++;
      }

      // Add delay between requests to be respectful to APIs
      if (i < clothingItems.length - 1) {
        console.log('⏸️ Pausing between requests...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }

    } catch (error) {
      console.error(`❌ Error processing item "${item.name}":`, error);
      failureCount++;
    }
  }

  const totalProcessed = successCount + failureCount;
  console.log(`🎯 AI image generation completed: ${successCount}/${totalProcessed} successful`);
  
  if (successCount > 0) {
    toast.success(`Generated ${successCount} professional images using AI!`);
  }
  
  if (failureCount > 0) {
    toast.warning(`${failureCount} images failed to generate. Check console for details.`);
  }
};

// Helper function to update wardrobe item with render image
const updateWardrobeItemWithRenderImage = async (
  wardrobeItemId: string,
  arrayIndex: number,
  renderImageUrl: string,
  usedCroppedImage: boolean = false
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`💾 Updating wardrobe item ${wardrobeItemId}[${arrayIndex}] with AI render image`);

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
        renderImageProvider: 'thenewblack',
        renderImageSourceType: usedCroppedImage ? 'cropped_image' : 'original_image',
        imageType: 'ai_generated'
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

      console.log(`✅ Successfully updated wardrobe item ${wardrobeItemId}[${arrayIndex}] with AI render image`);
      return { success: true };
    } else {
      console.error('❌ Invalid array index or item is not an object:', { arrayIndex, item: updatedItems[arrayIndex] });
      return { success: false, error: 'Invalid array index or item format' };
    }

  } catch (error) {
    console.error('❌ Error updating wardrobe item with AI render image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
