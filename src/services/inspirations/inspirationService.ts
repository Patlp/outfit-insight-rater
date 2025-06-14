
import { supabase } from '@/integrations/supabase/client';
import { CreateInspirationRequest, InspirationResult, GetInspirationsResult, OutfitInspiration } from './types';

export const createOutfitInspiration = async (
  userId: string,
  request: CreateInspirationRequest
): Promise<InspirationResult> => {
  try {
    console.log('Creating outfit inspiration:', request);

    const { data: inspiration, error } = await supabase
      .from('outfit_inspirations')
      .insert({
        user_id: userId,
        source_type: request.source_type,
        source_url: request.source_url,
        image_url: request.image_url,
        title: request.title,
        description: request.description,
        metadata: request.metadata || {},
        processing_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating outfit inspiration:', error);
      return { error: error.message };
    }

    console.log('Outfit inspiration created successfully:', inspiration.id);
    return { inspiration: inspiration as OutfitInspiration };

  } catch (error) {
    console.error('Error in createOutfitInspiration:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getOutfitInspirations = async (userId: string): Promise<GetInspirationsResult> => {
  try {
    console.log('Fetching outfit inspirations for user:', userId);

    const { data: inspirations, error } = await supabase
      .from('outfit_inspirations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching outfit inspirations:', error);
      return { error: error.message };
    }

    console.log(`Fetched ${inspirations?.length || 0} outfit inspirations`);
    return { inspirations: (inspirations || []) as OutfitInspiration[] };

  } catch (error) {
    console.error('Error in getOutfitInspirations:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const deleteOutfitInspiration = async (inspirationId: string): Promise<{ error?: string }> => {
  try {
    console.log('Deleting outfit inspiration:', inspirationId);

    const { error } = await supabase
      .from('outfit_inspirations')
      .delete()
      .eq('id', inspirationId);

    if (error) {
      console.error('Error deleting outfit inspiration:', error);
      return { error: error.message };
    }

    console.log('Outfit inspiration deleted successfully');
    return {};

  } catch (error) {
    console.error('Error in deleteOutfitInspiration:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const updateInspirationProcessingStatus = async (
  inspirationId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  extractedElements?: any[]
): Promise<{ error?: string }> => {
  try {
    console.log('Updating processing status for inspiration:', inspirationId, 'to:', status);

    const updateData: any = {
      processing_status: status,
      updated_at: new Date().toISOString()
    };

    if (extractedElements) {
      updateData.extracted_elements = extractedElements;
    }

    const { error } = await supabase
      .from('outfit_inspirations')
      .update(updateData)
      .eq('id', inspirationId);

    if (error) {
      console.error('Error updating inspiration processing status:', error);
      return { error: error.message };
    }

    console.log('Processing status updated successfully');
    return {};

  } catch (error) {
    console.error('Error in updateInspirationProcessingStatus:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
