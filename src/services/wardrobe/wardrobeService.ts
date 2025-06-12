
import { supabase } from '@/integrations/supabase/client';

export const updateWardrobeItemWithClothing = async (
  wardrobeItemId: string,
  clothingItems: any[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`📝 Updating wardrobe item ${wardrobeItemId} with ${clothingItems.length} clothing items`);

    const { error } = await supabase
      .from('wardrobe_items')
      .update({
        extracted_clothing_items: clothingItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', wardrobeItemId);

    if (error) {
      console.error('❌ Error updating wardrobe item with clothing:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Successfully updated wardrobe item with clothing items');
    return { success: true };

  } catch (error) {
    console.error('❌ Error in updateWardrobeItemWithClothing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
