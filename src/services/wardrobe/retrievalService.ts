
import { supabase } from '@/integrations/supabase/client';
import { GetWardrobeItemsResult } from './types';

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
