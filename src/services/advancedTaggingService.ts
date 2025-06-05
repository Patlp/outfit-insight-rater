
import { supabase } from '@/integrations/supabase/client';
import { AIClothingItem } from '@/services/clothingExtractionService';
import { TaggingLevel, TaggingConfig, TaggingResult, TAGGING_CONFIGS } from '@/types/tagging';
import { processBasicTagging, processMediumTagging, processAdvancedTagging } from './tagging/tagLevelProcessors';
import { extractItemsFromStyle } from './tagging/styleParser';
import { getPrimaryTaxonomy } from './primaryTaxonomyService';

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
  console.log(`Using PRIMARY TAXONOMY as primary source`);
  console.log(`Config:`, config);

  try {
    // Load primary taxonomy for reference
    const { data: primaryTaxonomy } = await getPrimaryTaxonomy(500);
    console.log(`Primary taxonomy loaded: ${primaryTaxonomy?.length || 0} items`);

    // Extract Style section references for all levels
    const styleReferences = extractItemsFromStyle(feedback);
    console.log(`Style section analysis: ${styleReferences.length} clothing items mentioned`);

    let finalItems: AIClothingItem[] = [];
    let extractionMethod = 'basic';

    switch (taggingLevel) {
      case 'basic':
        finalItems = await processBasicTagging(feedback, suggestions, config);
        extractionMethod = 'regex-with-primary-taxonomy-validation';
        break;
        
      case 'medium':
        finalItems = await processMediumTagging(feedback, suggestions, wardrobeItemId, config);
        extractionMethod = 'ai-with-primary-taxonomy-validation';
        break;
        
      case 'advanced':
        finalItems = await processAdvancedTagging(feedback, suggestions, wardrobeItemId, config);
        extractionMethod = 'enhanced-multi-dataset-with-primary-taxonomy-strict-validation';
        break;
    }

    // Apply primary taxonomy validation to all items
    if (primaryTaxonomy && primaryTaxonomy.length > 0) {
      finalItems = validateAgainstPrimaryTaxonomy(finalItems, primaryTaxonomy);
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
    console.log(`Primary taxonomy items: ${primaryTaxonomy?.length || 0}`);
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

const validateAgainstPrimaryTaxonomy = (items: AIClothingItem[], taxonomy: any[]): AIClothingItem[] => {
  console.log(`=== VALIDATING AGAINST PRIMARY TAXONOMY (${taxonomy.length} items) ===`);
  
  const validatedItems: AIClothingItem[] = [];
  
  for (const item of items) {
    // Check if item exists in primary taxonomy
    const taxonomyMatch = taxonomy.find(taxItem => {
      const itemNameLower = item.name.toLowerCase();
      const taxItemNameLower = taxItem.item_name.toLowerCase();
      
      // Exact match
      if (itemNameLower === taxItemNameLower) return true;
      
      // Partial matches
      return itemNameLower.includes(taxItemNameLower) || taxItemNameLower.includes(itemNameLower);
    });
    
    if (taxonomyMatch) {
      // Boost confidence for taxonomy matches
      const boostedConfidence = Math.min(0.98, item.confidence + 0.1);
      
      validatedItems.push({
        ...item,
        confidence: boostedConfidence,
        category: taxonomyMatch.category,
        source: `${item.source || 'unknown'}-taxonomy-validated`,
        primaryTaxonomyMatch: taxonomyMatch
      });
      
      console.log(`✅ Taxonomy match: "${item.name}" -> "${taxonomyMatch.item_name}" (${taxonomyMatch.category})`);
    } else {
      // Lower confidence for non-taxonomy items
      const reducedConfidence = item.confidence * 0.8;
      
      if (reducedConfidence >= 0.9) {
        validatedItems.push({
          ...item,
          confidence: reducedConfidence,
          source: `${item.source || 'unknown'}-non-taxonomy`
        });
        
        console.log(`⚠️ Non-taxonomy item kept: "${item.name}" (reduced confidence: ${reducedConfidence.toFixed(2)})`);
      } else {
        console.log(`❌ Non-taxonomy item rejected: "${item.name}" (confidence too low: ${reducedConfidence.toFixed(2)})`);
      }
    }
  }
  
  console.log(`=== TAXONOMY VALIDATION COMPLETE: ${validatedItems.length}/${items.length} items passed ===`);
  return validatedItems;
};
