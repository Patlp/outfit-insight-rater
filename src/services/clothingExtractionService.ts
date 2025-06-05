
import { supabase } from '@/integrations/supabase/client';

export interface AIClothingItem {
  name: string;
  descriptors: string[];
  category: string;
  confidence: number;
}

export const extractClothingPhrasesAI = async (
  feedback: string,
  suggestions: string[] = [],
  wardrobeItemId: string
): Promise<{ success: boolean; extractedItems?: AIClothingItem[]; error?: string }> => {
  try {
    console.log(`Starting AI clothing extraction for wardrobe item: ${wardrobeItemId}`);

    const { data, error } = await supabase.functions.invoke('extract-clothing-phrases', {
      body: {
        feedback,
        suggestions,
        wardrobeItemId
      }
    });

    if (error) {
      console.error('Error calling extract-clothing-phrases function:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to extract clothing phrases' 
      };
    }

    if (!data.success) {
      console.error('Function returned error:', data.error);
      return { 
        success: false, 
        error: data.error || 'Unknown error during extraction' 
      };
    }

    console.log(`Successfully extracted ${data.count} clothing items`);
    return { 
      success: true, 
      extractedItems: data.extractedItems 
    };

  } catch (error) {
    console.error('Service error during clothing extraction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

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
