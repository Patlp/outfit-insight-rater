
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

interface ContextAwareClothingItem {
  name: string;
  cleanName?: string;
  primaryColor?: string;
  colorConfidence?: number;
  fullDescription?: string;
  contextAwarePrompt?: string;
  category?: string;
  descriptors?: string[];
  originalImageUrl?: string;
  [key: string]: any;
}

export const generateClothingImage = async (
  itemName: string,
  wardrobeItemId: string,
  arrayIndex: number
): Promise<GenerateImageResult> => {
  try {
    console.log(`🎨 Starting context-aware AI image generation for: "${itemName}" [${wardrobeItemId}:${arrayIndex}]`);

    // First get the clothing item data to extract context-aware information
    const { data: existingItem, error: fetchError } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items')
      .eq('id', wardrobeItemId)
      .single();

    let clothingItem: ContextAwareClothingItem = { name: itemName };

    if (!fetchError && existingItem?.extracted_clothing_items) {
      const clothingItems = existingItem.extracted_clothing_items as any[];
      const targetItem = clothingItems[arrayIndex];
      
      if (targetItem) {
        clothingItem = {
          name: targetItem.name || itemName,
          cleanName: targetItem.cleanName,
          primaryColor: targetItem.primaryColor,
          colorConfidence: targetItem.colorConfidence,
          fullDescription: targetItem.fullDescription,
          contextAwarePrompt: targetItem.contextAwarePrompt,
          category: targetItem.category,
          descriptors: targetItem.descriptors,
          originalImageUrl: targetItem.originalImageUrl
        };
        
        console.log(`🎨 Using context-aware data for "${clothingItem.name}":`, {
          primaryColor: clothingItem.primaryColor,
          colorConfidence: clothingItem.colorConfidence,
          category: clothingItem.category,
          hasContextPrompt: !!clothingItem.contextAwarePrompt,
          colorPreserved: targetItem.colorPreserved
        });
      }

      // Check if this item already has a valid persisted render image
      if (targetItem?.renderImageUrl && targetItem?.renderImageGeneratedAt) {
        const generatedAt = new Date(targetItem.renderImageGeneratedAt);
        const now = new Date();
        const daysDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60 * 24);
        
        // If image is less than 30 days old, use the existing one
        if (daysDiff <= 30) {
          console.log(`✅ Using existing context-aware AI image for "${clothingItem.name}" (${daysDiff.toFixed(1)} days old)`);
          return { success: true, imageUrl: targetItem.renderImageUrl };
        } else {
          console.log(`⚠️ Existing AI image for "${clothingItem.name}" is expired (${daysDiff.toFixed(1)} days old), regenerating with context awareness...`);
        }
      }
    }

    // Use context-aware prompt if available, otherwise create one
    let finalPrompt = clothingItem.contextAwarePrompt;
    
    if (!finalPrompt) {
      // Fallback to creating a context-aware prompt
      console.log(`📝 Creating fallback context-aware prompt for "${clothingItem.name}"`);
      const primaryColor = clothingItem.primaryColor || 'neutral colored';
      const category = clothingItem.category || 'garment';
      
      finalPrompt = `Professional product photography of a "${clothingItem.name}", emphasizing accurate ${primaryColor} color representation, floating with invisible support on pure white seamless background, professional studio lighting with exact color fidelity, high resolution catalog style, clean isolated presentation with no shadows`;
      
      // Add negative prompt
      finalPrompt += `\n\nNEGATIVE PROMPT: no mannequin, no model, no person, no background elements, no additional clothing, no accessories, no shadows, no logos, no color distortion, maintain exact ${primaryColor} color tone`;
    }

    console.log(`📝 Using context-aware prompt for "${clothingItem.name}":`, finalPrompt.slice(0, 150) + '...');

    // Generate new AI image with context awareness
    const { data, error } = await supabase.functions.invoke('generate-clothing-image', {
      body: {
        itemName: clothingItem.name,
        wardrobeItemId,
        arrayIndex,
        contextAwarePrompt: finalPrompt,
        contextData: {
          primaryColor: clothingItem.primaryColor,
          colorConfidence: clothingItem.colorConfidence,
          category: clothingItem.category,
          fullDescription: clothingItem.fullDescription,
          originalImageUrl: clothingItem.originalImageUrl,
          preservedContext: true
        }
      }
    });

    if (error) {
      console.error('❌ Edge function invocation error:', error);
      toast.error(`Failed to generate context-aware image for ${clothingItem.name}: ${error.message}`);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      console.error('❌ Context-aware image generation failed:', data?.error);
      const errorMessage = data?.error || 'Unknown error during context-aware image generation';
      toast.error(`Context-aware image generation failed for ${clothingItem.name}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    console.log(`✅ Context-aware AI image generated and persisted successfully for "${clothingItem.name}": ${data.imageUrl}`);
    toast.success(`Generated context-accurate AI image for ${clothingItem.name}`);
    return { success: true, imageUrl: data.imageUrl };

  } catch (error) {
    console.error('❌ Context-aware AI image generation service error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`Failed to generate context-aware image for ${itemName}: ${errorMessage}`);
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
    console.log(`💾 Persisting context-aware AI image for wardrobe item ${wardrobeItemId}[${arrayIndex}]`);

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

    // Update the specific clothing item with the render image URL and context metadata
    const updatedItems = Array.from(wardrobeItem.extracted_clothing_items);
    if (updatedItems[arrayIndex] && typeof updatedItems[arrayIndex] === 'object') {
      const currentTimestamp = new Date().toISOString();
      
      updatedItems[arrayIndex] = {
        ...(updatedItems[arrayIndex] as Record<string, any>),
        renderImageUrl,
        renderImageGeneratedAt: currentTimestamp,
        renderImageProvider: 'openai',
        imageType: 'ai_generated_context_aware',
        persistedAt: currentTimestamp,
        isPersisted: true,
        contextAwareGeneration: true,
        colorPreserved: true,
        generationMethod: 'context_aware_prompting'
      };

      // Update the database with context-aware persistence tracking
      const { error: updateError } = await supabase
        .from('wardrobe_items')
        .update({
          extracted_clothing_items: updatedItems,
          updated_at: currentTimestamp
        })
        .eq('id', wardrobeItemId);

      if (updateError) {
        console.error('❌ Error persisting context-aware AI image to database:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log(`✅ Successfully persisted context-aware AI image for wardrobe item ${wardrobeItemId}[${arrayIndex}]`);
      console.log(`💾 Image URL: ${renderImageUrl}`);
      console.log(`📅 Generated and persisted at: ${currentTimestamp}`);
      console.log(`🎨 Context-aware generation: enabled`);
      console.log(`🌈 Color preservation: enabled`);
      
      return { success: true };
    } else {
      console.error('❌ Invalid array index or item is not an object:', { arrayIndex, item: updatedItems[arrayIndex] });
      return { success: false, error: 'Invalid array index or item format' };
    }

  } catch (error) {
    console.error('❌ Error persisting context-aware AI image:', error);
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
    console.log('⚠️ No clothing items to process for context-aware AI image generation');
    return;
  }

  console.log(`🔄 Starting batch context-aware AI image generation with persistence for ${clothingItems.length} clothing items`);
  toast.info(`Generating context-accurate AI images for ${clothingItems.length} clothing items...`);

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
          console.log(`⏭️ Skipping "${item.name}" - has valid persisted context-aware AI image (${daysDiff.toFixed(1)} days old)`);
          skippedCount++;
          return;
        }
      }

      try {
        console.log(`🎨 Processing ${arrayIndex + 1}/${clothingItems.length}: "${item.name}" with context: ${item.contextAwarePrompt ? 'available' : 'fallback'}`);

        const result = await generateClothingImage(item.name, wardrobeItemId, arrayIndex);
        
        if (result.success && result.imageUrl) {
          const updateResult = await updateWardrobeItemWithRenderImage(wardrobeItemId, arrayIndex, result.imageUrl);
          if (updateResult.success) {
            console.log(`✅ Successfully generated and persisted context-aware AI image for "${item.name}"`);
            successCount++;
          } else {
            console.error(`❌ Failed to persist context-aware AI image for "${item.name}":`, updateResult.error);
            failureCount++;
          }
        } else {
          console.warn(`⚠️ Failed to generate context-aware AI image for "${item.name}":`, result.error);
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
      console.log('⏸️ Pausing between context-aware generation batches...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const totalProcessed = successCount + failureCount + skippedCount;
  console.log(`🎯 Batch context-aware AI image generation completed: ${successCount} generated, ${skippedCount} skipped (already persisted), ${failureCount} failed`);
  
  if (successCount > 0) {
    toast.success(`Generated and saved ${successCount} new context-accurate AI images!`);
  }
  
  if (skippedCount > 0) {
    toast.info(`${skippedCount} items already had saved context-accurate AI images`);
  }
  
  if (failureCount > 0) {
    toast.warning(`${failureCount} context-accurate images failed to generate. Check console for details.`);
  }
};
