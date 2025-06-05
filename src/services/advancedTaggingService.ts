
import { supabase } from '@/integrations/supabase/client';
import { extractClothingItems, categorizeClothingItem } from '@/utils/clothingExtractor';
import { extractClothingPhrasesAI, AIClothingItem } from './clothingExtractionService';
import { enhancedClothingMatcher, convertToAIClothingItems } from './enhancedClothingMatcher';
import { TaggingLevel, TaggingConfig, TaggingResult, TAGGING_CONFIGS } from '@/types/tagging';

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
        extractionMethod = 'enhanced';
        break;
    }

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

const processBasicTagging = async (
  feedback: string, 
  suggestions: string[], 
  config: TaggingConfig
): Promise<AIClothingItem[]> => {
  console.log('Processing with BASIC tagging...');
  
  const regexResults = extractClothingItems(feedback);
  const items: AIClothingItem[] = regexResults.map(item => ({
    name: item,
    descriptors: [],
    category: categorizeClothingItem(item),
    confidence: 0.7,
    source: 'regex'
  }));

  return items.slice(0, config.maxItems);
};

const processMediumTagging = async (
  feedback: string,
  suggestions: string[],
  wardrobeItemId: string,
  config: TaggingConfig
): Promise<AIClothingItem[]> => {
  console.log('Processing with MEDIUM tagging...');
  
  // Try AI extraction first
  const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
  
  if (aiResult.success && aiResult.extractedItems && aiResult.extractedItems.length > 0) {
    return aiResult.extractedItems.slice(0, config.maxItems);
  }

  // Fallback to basic if AI fails
  console.log('AI extraction failed, falling back to basic...');
  return processBasicTagging(feedback, suggestions, config);
};

const processAdvancedTagging = async (
  feedback: string,
  suggestions: string[],
  wardrobeItemId: string,
  config: TaggingConfig
): Promise<AIClothingItem[]> => {
  console.log('Processing with ADVANCED tagging...');
  
  const fullText = [feedback, ...suggestions].join(' ');
  
  // Use enhanced matching with Kaggle dataset
  const enhancedMatches = await enhancedClothingMatcher(fullText, 'neutral');
  const enhancedItems = convertToAIClothingItems(enhancedMatches);
  
  if (enhancedItems.length > 0) {
    return enhancedItems.slice(0, config.maxItems);
  }

  // Fallback to medium if enhanced fails
  console.log('Enhanced matching failed, falling back to medium...');
  return processMediumTagging(feedback, suggestions, wardrobeItemId, config);
};
