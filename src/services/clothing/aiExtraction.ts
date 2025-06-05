
import { supabase } from '@/integrations/supabase/client';
import { AIClothingItem, ExtractionResponse } from './types';

export const extractClothingPhrasesAI = async (
  feedback: string,
  suggestions: string[] = [],
  wardrobeItemId: string
): Promise<ExtractionResponse> => {
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
