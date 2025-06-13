
import { supabase } from '@/integrations/supabase/client';

export const ensureOutfitImagesBucket = async (): Promise<void> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error checking buckets:', listError);
      return;
    }

    const outfitBucketExists = buckets?.some(bucket => bucket.name === 'outfit-images');
    
    if (!outfitBucketExists) {
      console.log('Creating outfit-images bucket...');
      
      const { error: createError } = await supabase.storage.createBucket('outfit-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('Error creating outfit-images bucket:', createError);
      } else {
        console.log('✅ Outfit-images bucket created successfully');
      }
    }
  } catch (error) {
    console.error('Error ensuring outfit-images bucket:', error);
  }
};

// Call this function to set up storage on app initialization
ensureOutfitImagesBucket();
