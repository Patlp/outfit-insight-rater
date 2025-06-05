

import { supabase } from '@/integrations/supabase/client';
import { AIClothingItem } from '@/services/clothingExtractionService';
import { TaggingLevel, TaggingConfig, TaggingResult, TAGGING_CONFIGS } from '@/types/tagging';
import { processBasicTagging, processMediumTagging, processAdvancedTagging } from './tagging/tagLevelProcessors';
import { extractItemsFromStyle } from './tagging/styleParser';

export const processClothingWithTaggingLevel = async (
  feedback: string,
  suggestions: string[] = [],
  wardrobeItemId: string,
  taggingLevel: TaggingLevel = 'advanced'
): Promise<{ success: boolean; result?: TaggingResult; items?: AIClothingItem[]; error?: string }> => {
  const startTime = Date.now();
  const config = TAGGING_CONFIGS[taggingLevel];
  
  console.log(`=== ENHANCED ADVANCED TAGGING SERVICE (${taggingLevel.toUpperCase()}) ===`);
  console.log(`STRICT MODE: 2-word max, 90% confidence, Style section validation`);
  console.log(`Config:`, config);

  try {
    // Extract Style section references for all levels
    const styleReferences = extractItemsFromStyle(feedback);
    console.log(`Style section analysis: ${styleReferences.length} clothing items mentioned`);

    let finalItems: AIClothingItem[] = [];
    let extractionMethod = 'basic';

    switch (taggingLevel) {
      case 'basic':
        finalItems = await processBasicTagging(feedback, suggestions, config);
        extractionMethod = 'regex-with-style-validation';
        break;
        
      case 'medium':
        finalItems = await processMediumTagging(feedback, suggestions, wardrobeItemId, config);
        extractionMethod = 'ai-with-style-validation';
        break;
        
      case 'advanced':
        finalItems = await processAdvancedTagging(feedback, suggestions, wardrobeItemId, config);
        extractionMethod = 'enhanced-multi-dataset-with-strict-validation';
        break;
    }

    // Final strict confidence and format validation
    finalItems = finalItems
      .filter(item => {
        const wordCount = item.name.split(' ').length;
        const meetsCriteria = item.confidence >= 0.9 && wordCount <= 2;
        
        if (!meetsCriteria) {
          console.log(`❌ Final filter rejected: "${item.name}" (confidence: ${item.confidence.toFixed(2)}, words: ${wordCount})`);
        }
        
        return meetsCriteria;
      })
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

    console.log(`=== ENHANCED TAGGING COMPLETE (${taggingLevel.toUpperCase()}) ===`);
    console.log(`Style references found: ${styleReferences.length}`);
    console.log(`Items found: ${finalItems.length}`);
    console.log(`Average confidence: ${averageConfidence.toFixed(2)}`);
    console.log(`Processing time: ${processingTime}ms`);
    
    finalItems.forEach((item, index) => {
      console.log(`${index + 1}. "${item.name}" (${item.confidence.toFixed(2)} confidence, ${item.name.split(' ').length} words)`);
    });

    return { success: true, result, items: finalItems };

  } catch (error) {
    console.error('Error in enhanced advanced tagging service:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

