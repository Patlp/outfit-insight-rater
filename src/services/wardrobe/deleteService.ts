
import { supabase } from '@/integrations/supabase/client';
import { DeleteWardrobeItemResult } from './types';

export const deleteWardrobeItem = async (itemId: string): Promise<DeleteWardrobeItemResult> => {
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
