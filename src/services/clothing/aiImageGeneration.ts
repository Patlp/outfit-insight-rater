import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

interface ColorAwareClothingItem {
  name: string;
  primaryColor?: string;
  colorConfidence?: number;
  fullDescription?: string;
  category?: string;
  descriptors?: string[];
  [key: string]: any;
}

// Enhanced color-specific prompt generation
const generateColorAwarePrompt = (item: ColorAwareClothingItem): string => {
  const itemName = item.name || 'clothing item';
  const primaryColor = item.primaryColor || 'neutral';
  const category = item.category || 'garment';
  
  // Build a comprehensive color-aware prompt
  let basePrompt = `Professional product photography of a single ${primaryColor} ${itemName}`;
  
  // Add color-specific details based on the primary color
  const colorEnhancements: Record<string, string> = {
    // Blacks
    'black': 'deep black with rich texture, elegant matte finish',
    'charcoal': 'sophisticated charcoal gray with subtle texture',
    
    // Whites  
    'white': 'pristine white with clean, crisp appearance',
    'cream': 'warm cream color with soft, luxurious texture',
    
    // Blues
    'navy blue': 'rich navy blue with deep, professional appearance',
    'royal blue': 'vibrant royal blue with bold, striking color',
    'sky blue': 'soft sky blue with light, airy quality',
    'denim blue': 'classic denim blue with authentic wash appearance',
    
    // Reds
    'burgundy': 'deep burgundy with rich, wine-like depth',
    'crimson': 'vibrant crimson red with bold intensity',
    'brick red': 'warm brick red with earthy undertones',
    
    // Greens
    'forest green': 'deep forest green with natural richness',
    'olive green': 'sophisticated olive green with muted elegance',
    'emerald green': 'brilliant emerald green with jewel-like vibrancy',
    'sage green': 'soft sage green with calming, muted tone',
    
    // Browns
    'chocolate brown': 'rich chocolate brown with warm depth',
    'tan': 'warm tan with natural, earthy appearance',
    'camel': 'luxurious camel color with sophisticated warmth',
    
    // Additional colors
    'gray': 'elegant gray with balanced neutral tone',
    'pink': 'soft pink with delicate, feminine quality',
    'purple': 'rich purple with regal depth',
    'yellow': 'bright yellow with cheerful vibrancy',
    'orange': 'warm orange with energetic appeal'
  };

  // Add color-specific enhancement if available
  const colorDetail = colorEnhancements[primaryColor.toLowerCase()];
  if (colorDetail) {
    basePrompt += `, ${colorDetail}`;
  }

  // Add fabric and material considerations based on category
  const categoryEnhancements: Record<string, string> = {
    'tops': 'with natural drape and fabric flow',
    'bottoms': 'with proper fit and structure',
    'dresses': 'with elegant silhouette and natural drape',
    'outerwear': 'with structured tailoring and professional finish',
    'footwear': 'with authentic material texture and finish',
    'accessories': 'with premium material quality and craftsmanship'
  };

  const categoryDetail = categoryEnhancements[category.toLowerCase()];
  if (categoryDetail) {
    basePrompt += ` ${categoryDetail}`;
  }

  // Add technical photography specifications
  basePrompt += ', floating with invisible support on pure white seamless background';
  basePrompt += ', professional studio lighting with soft even illumination';
  basePrompt += ', high resolution product photography with accurate color representation';
  basePrompt += ', clean isolated presentation with no shadows or reflections';

  // Add negative prompt for color accuracy
  const negativePrompt = `no mannequin, no model, no person, no background elements, no additional clothing, no accessories, no shadows, no logos, no color distortion, no oversaturation, no color bleeding, maintain accurate ${primaryColor} color tone`;

  return `${basePrompt}\n\nNEGATIVE PROMPT: ${negativePrompt}`;
};

export const generateClothingImage = async (
  itemName: string,
  wardrobeItemId: string,
  arrayIndex: number
): Promise<GenerateImageResult> => {
  try {
    console.log(`🎨 Starting color-aware AI image generation for: "${itemName}" [${wardrobeItemId}:${arrayIndex}]`);

    // First get the clothing item data to extract color information
    const { data: existingItem, error: fetchError } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items')
      .eq('id', wardrobeItemId)
      .single();

    let clothingItem: ColorAwareClothingItem = { name: itemName };

    if (!fetchError && existingItem?.extracted_clothing_items) {
      const clothingItems = existingItem.extracted_clothing_items as any[];
      const targetItem = clothingItems[arrayIndex];
      
      if (targetItem) {
        clothingItem = {
          name: targetItem.name || itemName,
          primaryColor: targetItem.primaryColor,
          colorConfidence: targetItem.colorConfidence,
          fullDescription: targetItem.fullDescription,
          category: targetItem.category,
          descriptors: targetItem.descriptors
        };
        
        console.log(`🎨 Using enhanced color data for "${clothingItem.name}":`, {
          primaryColor: clothingItem.primaryColor,
          colorConfidence: clothingItem.colorConfidence,
          category: clothingItem.category
        });
      }

      // Check if this item already has a valid persisted render image
      if (targetItem?.renderImageUrl && targetItem?.renderImageGeneratedAt) {
        const generatedAt = new Date(targetItem.renderImageGeneratedAt);
        const now = new Date();
        const daysDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60 * 24);
        
        // If image is less than 30 days old, use the existing one
        if (daysDiff <= 30) {
          console.log(`✅ Using existing persisted AI image for "${clothingItem.name}" (${daysDiff.toFixed(1)} days old)`);
          return { success: true, imageUrl: targetItem.renderImageUrl };
        } else {
          console.log(`⚠️ Existing AI image for "${clothingItem.name}" is expired (${daysDiff.toFixed(1)} days old), regenerating with color awareness...`);
        }
      }
    }

    // Generate color-aware prompt
    const colorAwarePrompt = generateColorAwarePrompt(clothingItem);
    console.log(`📝 Generated color-aware prompt for "${clothingItem.name}":`, colorAwarePrompt.slice(0, 150) + '...');

    // Generate new AI image with color awareness
    const { data, error } = await supabase.functions.invoke('generate-clothing-image', {
      body: {
        itemName: clothingItem.name,
        wardrobeItemId,
        arrayIndex,
        colorPrompt: colorAwarePrompt,
        colorData: {
          primaryColor: clothingItem.primaryColor,
          colorConfidence: clothingItem.colorConfidence,
          category: clothingItem.category,
          fullDescription: clothingItem.fullDescription
        }
      }
    });

    if (error) {
      console.error('❌ Edge function invocation error:', error);
      toast.error(`Failed to generate color-aware image for ${clothingItem.name}: ${error.message}`);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      console.error('❌ Color-aware image generation failed:', data?.error);
      const errorMessage = data?.error || 'Unknown error during color-aware image generation';
      toast.error(`Color-aware image generation failed for ${clothingItem.name}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    console.log(`✅ Color-aware AI image generated and persisted successfully for "${clothingItem.name}": ${data.imageUrl}`);
    toast.success(`Generated color-accurate AI image for ${clothingItem.name}`);
    return { success: true, imageUrl: data.imageUrl };

  } catch (error) {
    console.error('❌ Color-aware AI image generation service error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`Failed to generate color-aware image for ${itemName}: ${errorMessage}`);
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
    console.log(`💾 Persisting color-aware AI image for wardrobe item ${wardrobeItemId}[${arrayIndex}]`);

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

    // Update the specific clothing item with the render image URL and enhanced color metadata
    const updatedItems = Array.from(wardrobeItem.extracted_clothing_items);
    if (updatedItems[arrayIndex] && typeof updatedItems[arrayIndex] === 'object') {
      const currentTimestamp = new Date().toISOString();
      
      updatedItems[arrayIndex] = {
        ...(updatedItems[arrayIndex] as Record<string, any>),
        renderImageUrl,
        renderImageGeneratedAt: currentTimestamp,
        renderImageProvider: 'openai',
        imageType: 'ai_generated_color_aware',
        persistedAt: currentTimestamp,
        isPersisted: true,
        colorAwareGeneration: true,
        generationMethod: 'enhanced_color_prompting'
      };

      // Update the database with color-aware persistence tracking
      const { error: updateError } = await supabase
        .from('wardrobe_items')
        .update({
          extracted_clothing_items: updatedItems,
          updated_at: currentTimestamp
        })
        .eq('id', wardrobeItemId);

      if (updateError) {
        console.error('❌ Error persisting color-aware AI image to database:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log(`✅ Successfully persisted color-aware AI image for wardrobe item ${wardrobeItemId}[${arrayIndex}]`);
      console.log(`💾 Image URL: ${renderImageUrl}`);
      console.log(`📅 Generated and persisted at: ${currentTimestamp}`);
      console.log(`🎨 Color-aware generation: enabled`);
      
      return { success: true };
    } else {
      console.error('❌ Invalid array index or item is not an object:', { arrayIndex, item: updatedItems[arrayIndex] });
      return { success: false, error: 'Invalid array index or item format' };
    }

  } catch (error) {
    console.error('❌ Error persisting color-aware AI image:', error);
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
    console.log('⚠️ No clothing items to process for color-aware AI image generation');
    return;
  }

  console.log(`🔄 Starting batch color-aware AI image generation with persistence for ${clothingItems.length} clothing items`);
  toast.info(`Generating color-accurate AI images for ${clothingItems.length} clothing items...`);

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
          console.log(`⏭️ Skipping "${item.name}" - has valid persisted color-aware AI image (${daysDiff.toFixed(1)} days old)`);
          skippedCount++;
          return;
        }
      }

      try {
        console.log(`🎨 Processing ${arrayIndex + 1}/${clothingItems.length}: "${item.name}" with color: ${item.primaryColor || 'unknown'}`);

        const result = await generateClothingImage(item.name, wardrobeItemId, arrayIndex);
        
        if (result.success && result.imageUrl) {
          const updateResult = await updateWardrobeItemWithRenderImage(wardrobeItemId, arrayIndex, result.imageUrl);
          if (updateResult.success) {
            console.log(`✅ Successfully generated and persisted color-aware AI image for "${item.name}"`);
            successCount++;
          } else {
            console.error(`❌ Failed to persist color-aware AI image for "${item.name}":`, updateResult.error);
            failureCount++;
          }
        } else {
          console.warn(`⚠️ Failed to generate color-aware AI image for "${item.name}":`, result.error);
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
      console.log('⏸️ Pausing between color-aware generation batches...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const totalProcessed = successCount + failureCount + skippedCount;
  console.log(`🎯 Batch color-aware AI image generation completed: ${successCount} generated, ${skippedCount} skipped (already persisted), ${failureCount} failed`);
  
  if (successCount > 0) {
    toast.success(`Generated and saved ${successCount} new color-accurate AI images!`);
  }
  
  if (skippedCount > 0) {
    toast.info(`${skippedCount} items already had saved color-accurate AI images`);
  }
  
  if (failureCount > 0) {
    toast.warning(`${failureCount} color-accurate images failed to generate. Check console for details.`);
  }
};
