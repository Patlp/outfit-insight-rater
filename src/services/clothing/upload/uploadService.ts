
import { supabase } from '@/integrations/supabase/client';

export const uploadCroppedImage = async (
  blob: Blob,
  wardrobeItemId: string,
  itemName: string
): Promise<string> => {
  try {
    // Create a simple filename
    const fileName = `${wardrobeItemId}_${itemName.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    const filePath = `cropped-items/${fileName}`;

    console.log(`📤 Uploading cropped image: ${filePath}`);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('wardrobe-items')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('wardrobe-items')
      .getPublicUrl(filePath);

    console.log(`✅ Upload successful: ${publicUrl}`);
    
    // Verify the URL is accessible
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ Image URL verified accessible: ${publicUrl}`);
      } else {
        console.warn(`⚠️ Image URL may not be accessible: ${response.status} ${response.statusText}`);
      }
    } catch (fetchError) {
      console.warn(`⚠️ Could not verify image URL accessibility:`, fetchError);
    }
    
    return publicUrl;

  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
};
