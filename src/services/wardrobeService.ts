
import { supabase } from '@/integrations/supabase/client';
import { extractFashionTagsWithVision, fileToBase64 } from './clothing/visionTaggingService';
import { processImageCropping } from './clothing/croppingService';

export interface WardrobeItem {
  id: string;
  user_id: string;
  image_url: string;
  rating_score: number | null;
  feedback: string | null;
  suggestions: string[] | null;
  gender: string | null;
  occasion_context: string | null;
  feedback_mode: string | null;
  extracted_clothing_items: any | null;
  cropped_images: any | null;
  created_at: string;
  updated_at: string;
}

export interface SaveOutfitResult {
  wardrobeItem?: WardrobeItem;
  error?: string;
}

export interface GetWardrobeItemsResult {
  items?: WardrobeItem[];
  error?: string;
}

export const saveOutfitToWardrobe = async (
  userId: string,
  originalImageUrl: string, // Renamed to be explicit about using original image
  ratingScore: number,
  feedback: string,
  suggestions: string[],
  gender: string,
  occasionContext?: string,
  feedbackMode: string = 'normal',
  imageFile?: File
): Promise<SaveOutfitResult> => {
  try {
    console.log('🔄 Saving outfit to wardrobe for user:', userId);
    console.log('📸 Using original image URL:', originalImageUrl);

    // Insert the wardrobe item with the original image URL
    const { data: wardrobeItem, error: insertError } = await supabase
      .from('wardrobe_items')
      .insert({
        user_id: userId,
        image_url: originalImageUrl, // Store the original image URL
        rating_score: ratingScore,
        feedback,
        suggestions,
        gender,
        occasion_context: occasionContext,
        feedback_mode: feedbackMode
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting wardrobe item:', insertError);
      return { error: insertError.message };
    }

    console.log('✅ Wardrobe item saved with ID:', wardrobeItem.id);
    console.log('📸 Original image URL stored:', wardrobeItem.image_url);

    // Process both vision tagging and cropping in parallel if image file is available
    // This is for AI analysis only - the display will always use the original image
    if (imageFile) {
      try {
        console.log('🔍 Starting background AI processing (for tagging only)...');
        
        const imageBase64 = await fileToBase64(imageFile);

        // Start both processes in parallel
        const [visionResult, croppedImages] = await Promise.allSettled([
          extractFashionTagsWithVision(imageBase64, wardrobeItem.id),
          processImageCropping(imageFile, wardrobeItem.id)
        ]);

        // Process vision tagging results
        let formattedTags: any[] = [];
        if (visionResult.status === 'fulfilled' && visionResult.value.success && visionResult.value.tags) {
          console.log(`🏷️ Vision tagging successful: ${visionResult.value.tags.length} tags found`);
          
          formattedTags = visionResult.value.tags.map(tag => ({
            name: tag,
            descriptors: [],
            category: categorizeTag(tag),
            confidence: 0.9,
            source: 'openai-vision'
          }));
        } else {
          console.warn('⚠️ Vision tagging failed:', visionResult.status === 'rejected' ? visionResult.reason : visionResult.value.error);
        }

        // Process cropping results
        let croppedImagesData: any[] = [];
        if (croppedImages.status === 'fulfilled') {
          croppedImagesData = croppedImages.value;
          console.log(`🎯 Image cropping successful: ${croppedImagesData.length} cropped items`);
        } else {
          console.warn('⚠️ Image cropping failed:', croppedImages.reason);
        }

        // Update wardrobe item with both results
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (formattedTags.length > 0) {
          updateData.extracted_clothing_items = formattedTags;
        }

        if (croppedImagesData.length > 0) {
          updateData.cropped_images = croppedImagesData;
        }

        // Note: We deliberately do NOT update the image_url here to preserve the original
        if (Object.keys(updateData).length > 1) { // More than just updated_at
          const { error: updateError } = await supabase
            .from('wardrobe_items')
            .update(updateData)
            .eq('id', wardrobeItem.id);

          if (updateError) {
            console.error('⚠️ Failed to save AI processing results:', updateError);
          } else {
            console.log(`✅ Successfully saved AI processing results (original image preserved)`);
            // Update the returned item with the new data
            wardrobeItem.extracted_clothing_items = updateData.extracted_clothing_items || wardrobeItem.extracted_clothing_items;
            wardrobeItem.cropped_images = updateData.cropped_images || wardrobeItem.cropped_images;
          }
        }

      } catch (processingError) {
        console.error('❌ Background AI processing error (continuing with save):', processingError);
        // Don't fail the entire save operation if background processing fails
      }
    } else {
      console.log('📷 No image file provided for AI processing');
    }

    return { wardrobeItem };

  } catch (error) {
    console.error('❌ Error saving outfit to wardrobe:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Helper function to categorize tags based on clothing type
const categorizeTag = (tag: string): string => {
  const lowerTag = tag.toLowerCase();
  
  if (lowerTag.includes('shirt') || lowerTag.includes('blouse') || lowerTag.includes('top') || 
      lowerTag.includes('tee') || lowerTag.includes('sweater') || lowerTag.includes('cardigan') || 
      lowerTag.includes('hoodie') || lowerTag.includes('tank') || lowerTag.includes('polo')) {
    return 'tops';
  }
  
  if (lowerTag.includes('pants') || lowerTag.includes('jeans') || lowerTag.includes('trousers') || 
      lowerTag.includes('shorts') || lowerTag.includes('skirt') || lowerTag.includes('leggings')) {
    return 'bottoms';
  }
  
  if (lowerTag.includes('dress') || lowerTag.includes('gown')) {
    return 'dresses';
  }
  
  if (lowerTag.includes('jacket') || lowerTag.includes('blazer') || lowerTag.includes('coat') || 
      lowerTag.includes('vest') || lowerTag.includes('cardigan')) {
    return 'outerwear';
  }
  
  if (lowerTag.includes('shoes') || lowerTag.includes('sneakers') || lowerTag.includes('heels') || 
      lowerTag.includes('boots') || lowerTag.includes('sandals') || lowerTag.includes('flats') ||
      lowerTag.includes('loafers')) {
    return 'footwear';
  }
  
  if (lowerTag.includes('belt') || lowerTag.includes('bag') || lowerTag.includes('hat') || 
      lowerTag.includes('scarf') || lowerTag.includes('necklace') || lowerTag.includes('bracelet') || 
      lowerTag.includes('watch') || lowerTag.includes('earrings') || lowerTag.includes('sunglasses') ||
      lowerTag.includes('beanie') || lowerTag.includes('cap') || lowerTag.includes('clips')) {
    return 'accessories';
  }
  
  return 'other';
};

export const getWardrobeItems = async (userId: string): Promise<GetWardrobeItemsResult> => {
  try {
    console.log('Fetching wardrobe items for user:', userId);

    const { data: items, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wardrobe items:', error);
      return { error: error.message };
    }

    console.log(`Fetched ${items?.length || 0} wardrobe items`);
    return { items: items || [] };

  } catch (error) {
    console.error('Error in getWardrobeItems:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const deleteWardrobeItem = async (itemId: string): Promise<{ error?: string }> => {
  try {
    console.log('Deleting wardrobe item:', itemId);

    const { error } = await supabase
      .from('wardrobe_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting wardrobe item:', error);
      return { error: error.message };
    }

    console.log('Wardrobe item deleted successfully');
    return {};

  } catch (error) {
    console.error('Error in deleteWardrobeItem:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
