
import { supabase } from '@/integrations/supabase/client';

export interface OutfitInspiration {
  id: string;
  user_id: string;
  source_type: string;
  source_url?: string;
  image_url: string;
  title?: string;
  description?: string;
  extracted_elements?: any;
  metadata?: any;
  processing_status?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportPinterestParams {
  userId: string;
  sourceUrl: string;
  sourceType: 'pinterest';
}

export interface UploadPhotoParams {
  userId: string;
  file: File;
  title?: string;
  description?: string;
}

export interface OutfitInspirationResult {
  inspiration?: OutfitInspiration;
  error?: string;
}

export interface OutfitInspirationsResult {
  inspirations?: OutfitInspiration[];
  error?: string;
}

export const importPinterestContent = async (params: ImportPinterestParams): Promise<OutfitInspirationResult> => {
  try {
    console.log('📌 Starting Pinterest import:', params);

    // For now, we'll create a placeholder entry since we don't have Pinterest API integration yet
    // In a real implementation, you would:
    // 1. Parse the Pinterest URL to extract board/pin ID
    // 2. Use Pinterest API to fetch images and metadata
    // 3. Download and store the images
    // 4. Extract outfit elements from the images

    const mockImageUrl = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7';
    
    const { data, error } = await supabase
      .from('outfit_inspirations')
      .insert({
        user_id: params.userId,
        source_type: params.sourceType,
        source_url: params.sourceUrl,
        image_url: mockImageUrl,
        title: `Pinterest inspiration from ${new Date().toLocaleDateString()}`,
        description: 'Imported from Pinterest board or pin',
        processing_status: 'pending',
        metadata: {
          originalUrl: params.sourceUrl,
          importedAt: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to save Pinterest import:', error);
      return { error: error.message };
    }

    console.log('✅ Pinterest import saved successfully:', data);
    return { inspiration: data };

  } catch (error) {
    console.error('❌ Pinterest import error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const uploadOutfitPhoto = async (params: UploadPhotoParams): Promise<OutfitInspirationResult> => {
  try {
    console.log('📷 Starting photo upload:', params.file.name);

    // Create a unique filename
    const fileExt = params.file.name.split('.').pop();
    const fileName = `${params.userId}/${Date.now()}.${fileExt}`;

    // For now, we'll use a placeholder URL since we don't have storage set up
    // In a real implementation, you would:
    // 1. Upload the file to Supabase Storage
    // 2. Get the public URL
    // 3. Process the image to extract outfit elements
    
    const mockImageUrl = URL.createObjectURL(params.file);

    const { data, error } = await supabase
      .from('outfit_inspirations')
      .insert({
        user_id: params.userId,
        source_type: 'upload',
        image_url: mockImageUrl,
        title: params.title || `Uploaded outfit - ${new Date().toLocaleDateString()}`,
        description: params.description || 'Uploaded outfit photo',
        processing_status: 'pending',
        metadata: {
          fileName: params.file.name,
          fileSize: params.file.size,
          fileType: params.file.type,
          uploadedAt: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to save uploaded photo:', error);
      return { error: error.message };
    }

    console.log('✅ Photo upload saved successfully:', data);
    return { inspiration: data };

  } catch (error) {
    console.error('❌ Photo upload error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getOutfitInspirations = async (userId: string): Promise<OutfitInspirationsResult> => {
  try {
    console.log('🔍 Fetching outfit inspirations for user:', userId);

    const { data, error } = await supabase
      .from('outfit_inspirations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch inspirations:', error);
      return { error: error.message };
    }

    console.log('✅ Fetched inspirations successfully:', data?.length || 0);
    return { inspirations: data || [] };

  } catch (error) {
    console.error('❌ Error fetching inspirations:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const deleteOutfitInspiration = async (inspirationId: string): Promise<{ error?: string }> => {
  try {
    console.log('🗑️ Deleting outfit inspiration:', inspirationId);

    const { error } = await supabase
      .from('outfit_inspirations')
      .delete()
      .eq('id', inspirationId);

    if (error) {
      console.error('❌ Failed to delete inspiration:', error);
      return { error: error.message };
    }

    console.log('✅ Inspiration deleted successfully');
    return {};

  } catch (error) {
    console.error('❌ Error deleting inspiration:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
