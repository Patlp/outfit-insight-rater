
import { supabase } from '@/integrations/supabase/client';
import { extractFashionTagsWithVision, fileToBase64 } from '../clothing/visionTaggingService';
import { processImageCropping } from '../clothing/croppingService';
import { categorizeTag } from './categoryService';
import { SaveOutfitResult } from './types';

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
