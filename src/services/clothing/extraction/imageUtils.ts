
// Image upload and wardrobe item utilities

import { supabase } from '@/integrations/supabase/client';

// Helper function to upload image for analysis services that need URLs
export const uploadImageForAnalysis = async (imageFile: File, wardrobeItemId: string): Promise<string> => {
  const fileName = `analysis_${wardrobeItemId}_${Date.now()}.${imageFile.name.split('.').pop()}`;
  
  const { data, error } = await supabase.storage
    .from('outfit-images')
    .upload(fileName, imageFile, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload image for analysis: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('outfit-images')
    .getPublicUrl(data.path);

  return publicUrl;
};

// Helper function to update wardrobe item with extracted clothing
export const updateWardrobeItemWithClothing = async (wardrobeItemId: string, clothingItems: any[]): Promise<void> => {
  const { error } = await supabase
    .from('wardrobe_items')
    .update({
      extracted_clothing_items: clothingItems,
      updated_at: new Date().toISOString()
    })
    .eq('id', wardrobeItemId);

  if (error) {
    throw new Error(`Failed to update wardrobe item: ${error.message}`);
  }
};

// Helper function to get wardrobe item image URL
export const getWardrobeItemImageUrl = async (wardrobeItemId: string): Promise<string | null> => {
  const { data: wardrobeItem } = await supabase
    .from('wardrobe_items')
    .select('original_image_url, image_url')
    .eq('id', wardrobeItemId)
    .single();

  return wardrobeItem?.original_image_url || wardrobeItem?.image_url || null;
};
