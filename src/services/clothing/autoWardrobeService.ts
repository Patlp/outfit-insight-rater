
// Auto Wardrobe service for clean clothing tag extraction
import { extractCleanClothingTags } from './cleanTagExtractor';
import { supabase } from '@/integrations/supabase/client';

export interface AutoWardrobeResult {
  success: boolean;
  tags: string[];
  wardrobeItemId?: string;
  error?: string;
}

export const processAutoWardrobeTagging = async (
  wardrobeItemId: string,
  feedback: string,
  suggestions: string[] = []
): Promise<AutoWardrobeResult> => {
  try {
    console.log('=== AUTO WARDROBE PROCESSING START ===');
    console.log('Wardrobe item ID:', wardrobeItemId);
    
    // Combine feedback and suggestions into full insight text
    const fullInsight = [feedback, ...suggestions].join(' ');
    
    if (!fullInsight || fullInsight.trim().length === 0) {
      console.log('No insight text provided');
      return { success: true, tags: [] };
    }

    // Extract clean clothing tags
    const extractionResult = await extractCleanClothingTags(fullInsight);
    
    if (!extractionResult.success) {
      console.error('Tag extraction failed:', extractionResult.error);
      return {
        success: false,
        tags: [],
        error: extractionResult.error
      };
    }

    // Convert tags to the expected wardrobe format
    const wardrobeTags = extractionResult.tags.map(tag => ({
      name: tag,
      descriptors: [],
      category: categorizeTag(tag),
      confidence: 0.85,
      source: 'auto-wardrobe'
    }));

    // Update wardrobe item with extracted tags
    const { error: updateError } = await supabase
      .from('wardrobe_items')
      .update({ 
        extracted_clothing_items: wardrobeTags,
        updated_at: new Date().toISOString()
      })
      .eq('id', wardrobeItemId);

    if (updateError) {
      console.error('Error updating wardrobe item:', updateError);
      throw new Error('Failed to save clothing tags');
    }

    console.log(`Successfully processed ${wardrobeTags.length} tags for wardrobe item ${wardrobeItemId}`);
    console.log('=== AUTO WARDROBE PROCESSING COMPLETE ===');

    return {
      success: true,
      tags: extractionResult.tags,
      wardrobeItemId
    };

  } catch (error) {
    console.error('Error in auto wardrobe processing:', error);
    return {
      success: false,
      tags: [],
      error: error instanceof Error ? error.message : 'Unknown processing error'
    };
  }
};

// Helper function to categorize tags
const categorizeTag = (tag: string): string => {
  const lowerTag = tag.toLowerCase();
  
  if (lowerTag.includes('shirt') || lowerTag.includes('blouse') || lowerTag.includes('top') || 
      lowerTag.includes('sweater') || lowerTag.includes('cardigan') || lowerTag.includes('hoodie') || 
      lowerTag.includes('t-shirt') || lowerTag.includes('tee') || lowerTag.includes('polo')) {
    return 'tops';
  }
  
  if (lowerTag.includes('pants') || lowerTag.includes('jeans') || lowerTag.includes('trousers') || 
      lowerTag.includes('shorts') || lowerTag.includes('skirt')) {
    return 'bottoms';
  }
  
  if (lowerTag.includes('dress')) {
    return 'dresses';
  }
  
  if (lowerTag.includes('jacket') || lowerTag.includes('blazer') || lowerTag.includes('coat') || 
      lowerTag.includes('vest')) {
    return 'outerwear';
  }
  
  if (lowerTag.includes('shoes') || lowerTag.includes('sneakers') || lowerTag.includes('heels') || 
      lowerTag.includes('boots') || lowerTag.includes('sandals') || lowerTag.includes('flats')) {
    return 'footwear';
  }
  
  if (lowerTag.includes('belt') || lowerTag.includes('bag') || lowerTag.includes('hat') || 
      lowerTag.includes('scarf') || lowerTag.includes('necklace') || lowerTag.includes('bracelet') || 
      lowerTag.includes('watch') || lowerTag.includes('earrings') || lowerTag.includes('sunglasses')) {
    return 'accessories';
  }
  
  return 'other';
};
