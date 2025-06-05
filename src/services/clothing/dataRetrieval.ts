
import { supabase } from '@/integrations/supabase/client';
import { AIClothingItem } from './types';

export const getExtractedClothingItems = async (wardrobeItemId: string): Promise<AIClothingItem[] | null> => {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items')
      .eq('id', wardrobeItemId)
      .single();

    if (error) {
      console.error('Error fetching extracted clothing items:', error);
      return null;
    }

    // Properly handle the JSON type and validate it's an array of AIClothingItem
    const extractedItems = data?.extracted_clothing_items;
    
    if (!extractedItems || !Array.isArray(extractedItems)) {
      return null;
    }

    // Cast to unknown[] first to avoid direct type assertion issues
    const unknownItems = extractedItems as unknown[];

    // Type guard to ensure each item has the required properties
    const isValidAIClothingItem = (item: unknown): item is AIClothingItem => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof (item as any).name === 'string' &&
        Array.isArray((item as any).descriptors) &&
        typeof (item as any).category === 'string' &&
        typeof (item as any).confidence === 'number'
      );
    };

    // Filter and validate the items with explicit type narrowing
    const validItems: AIClothingItem[] = [];
    for (const item of unknownItems) {
      if (isValidAIClothingItem(item)) {
        validItems.push(item);
      }
    }
    
    return validItems.length > 0 ? validItems : null;
  } catch (error) {
    console.error('Error in getExtractedClothingItems:', error);
    return null;
  }
};
