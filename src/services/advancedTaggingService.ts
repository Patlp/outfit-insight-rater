
import { supabase } from '@/integrations/supabase/client';
import { AIClothingItem } from '@/services/clothingExtractionService';
import { TaggingLevel, TaggingConfig, TaggingResult, TAGGING_CONFIGS } from '@/types/tagging';
import { processBasicTagging, processMediumTagging, processAdvancedTagging } from './tagging/tagLevelProcessors';
import { filterIndividualClothingItems } from './tagging/itemFilters';

export const processClothingWithTaggingLevel = async (
  feedback: string,
  suggestions: string[] = [],
  wardrobeItemId: string,
  taggingLevel: TaggingLevel = 'advanced'
): Promise<{ success: boolean; result?: TaggingResult; items?: AIClothingItem[]; error?: string }> => {
  const startTime = Date.now();
  const config = TAGGING_CONFIGS[taggingLevel];
  
  console.log(`=== ADVANCED TAGGING SERVICE (${taggingLevel.toUpperCase()}) ===`);
  console.log(`Config:`, config);

  try {
    let finalItems: AIClothingItem[] = [];
    let extractionMethod = 'basic';

    switch (taggingLevel) {
      case 'basic':
        finalItems = await processBasicTagging(feedback, suggestions, config);
        extractionMethod = 'regex';
        break;
        
      case 'medium':
        finalItems = await processMediumTagging(feedback, suggestions, wardrobeItemId, config);
        extractionMethod = 'ai';
        break;
        
      case 'advanced':
        finalItems = await processAdvancedTagging(feedback, suggestions, wardrobeItemId, config);
        extractionMethod = 'enhanced-multi-dataset';
        break;
    }

    // Apply strict individual item filtering
    finalItems = filterIndividualClothingItems(finalItems);

    // Apply config filters
    finalItems = finalItems
      .filter(item => item.confidence >= config.minConfidence)
      .slice(0, config.maxItems);

    // Update wardrobe item
    if (finalItems.length > 0) {
      const { error: updateError } = await supabase
        .from('wardrobe_items')
        .update({ 
          extracted_clothing_items: finalItems,
          updated_at: new Date().toISOString()
        })
        .eq('id', wardrobeItemId);

      if (updateError) {
        throw new Error('Failed to update wardrobe item');
      }
    }

    const processingTime = Date.now() - startTime;
    const averageConfidence = finalItems.length > 0 
      ? finalItems.reduce((sum, item) => sum + item.confidence, 0) / finalItems.length 
      : 0;

    const result: TaggingResult = {
      level: taggingLevel,
      itemCount: finalItems.length,
      averageConfidence,
      extractionMethod,
      processingTime
    };

    console.log(`=== TAGGING COMPLETE (${taggingLevel.toUpperCase()}) ===`);
    console.log(`Items found: ${finalItems.length}`);
    console.log(`Average confidence: ${averageConfidence.toFixed(2)}`);
    console.log(`Processing time: ${processingTime}ms`);

    return { success: true, result, items: finalItems };

  } catch (error) {
    console.error('Error in advanced tagging service:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
