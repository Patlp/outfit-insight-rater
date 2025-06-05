import { supabase } from '@/integrations/supabase/client';
import { extractClothingItems, categorizeClothingItem } from '@/utils/clothingExtractor';
import { extractClothingPhrasesAI, AIClothingItem } from './clothingExtractionService';
import { enhancedClothingMatcher, convertToAIClothingItems } from './enhancedClothingMatcher';
import { fashionpediaClothingMatcher } from './fashionpediaClothingMatcher';
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
        extractionMethod = 'enhanced-multi-dataset';
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
  console.log('Processing with ADVANCED MULTI-DATASET tagging...');
  console.log('Using structured format: Colour + Clothing Item + Material + Pattern');
  
  const fullText = [feedback, ...suggestions].join(' ');
  const allItems: AIClothingItem[] = [];
  
  // Step 1: Enhanced matching with Kaggle dataset
  console.log('Step 1: Enhanced Kaggle dataset matching...');
  try {
    const enhancedMatches = await enhancedClothingMatcher(fullText, 'neutral');
    const enhancedItems = convertToAIClothingItems(enhancedMatches);
    
    if (enhancedItems.length > 0) {
      console.log(`✅ Enhanced matching found ${enhancedItems.length} items`);
      allItems.push(...enhancedItems.map(item => ({
        ...item,
        source: 'kaggle-enhanced',
        confidence: item.confidence * 0.95 // High confidence for Kaggle data
      })));
    }
  } catch (error) {
    console.warn('Enhanced matching failed:', error);
  }

  // Step 2: Fashionpedia dataset matching
  console.log('Step 2: Fashionpedia dataset matching...');
  try {
    const fashionpediaMatches = await fashionpediaClothingMatcher(fullText, 5);
    
    if (fashionpediaMatches.length > 0) {
      console.log(`✅ Fashionpedia matching found ${fashionpediaMatches.length} items`);
      allItems.push(...fashionpediaMatches.map(match => ({
        name: match.name,
        descriptors: match.description ? [match.description] : [],
        category: match.category,
        confidence: match.confidence * 0.85, // Good confidence for Fashionpedia
        source: 'fashionpedia',
        fashionpediaData: match.fashionpediaData
      })));
    }
  } catch (error) {
    console.warn('Fashionpedia matching failed:', error);
  }

  // Step 3: AI extraction with structured format
  console.log('Step 3: AI extraction with structured formatting...');
  try {
    const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
    
    if (aiResult.success && aiResult.extractedItems && aiResult.extractedItems.length > 0) {
      console.log(`✅ AI extraction found ${aiResult.extractedItems.length} items`);
      allItems.push(...aiResult.extractedItems.map(item => ({
        ...item,
        source: 'ai-structured',
        confidence: item.confidence * 0.9 // Good confidence for AI
      })));
    }
  } catch (error) {
    console.warn('AI extraction failed:', error);
  }

  // Step 4: Apply structured format to all items
  const structuredItems = await applyStructuredFormat(allItems, fullText);

  // Step 5: Remove duplicates and rank by confidence
  const deduplicatedItems = removeDuplicates(structuredItems);
  
  // Step 6: Sort by confidence and limit results
  const finalItems = deduplicatedItems
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, config.maxItems);

  console.log(`=== ADVANCED TAGGING COMPLETE ===`);
  console.log(`Total items from all datasets: ${allItems.length}`);
  console.log(`After structured formatting: ${structuredItems.length}`);
  console.log(`After deduplication: ${deduplicatedItems.length}`);
  console.log(`Final items: ${finalItems.length}`);

  finalItems.forEach((item, index) => {
    console.log(`${index + 1}. ${item.name} (${item.source}, confidence: ${item.confidence.toFixed(2)})`);
  });

  return finalItems;
};

const applyStructuredFormat = async (items: AIClothingItem[], fullText: string): Promise<AIClothingItem[]> => {
  console.log('Applying structured format: Colour + Clothing Item + Material + Pattern');
  
  // Define extraction patterns
  const colorWords = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'grey', 'navy', 'beige', 'cream', 'tan', 'olive', 'maroon', 'teal', 'coral', 'burgundy', 'khaki', 'mint', 'lavender', 'gold', 'silver', 'orange'];
  const materialWords = ['cotton', 'denim', 'leather', 'silk', 'wool', 'linen', 'cashmere', 'velvet', 'satin', 'chiffon', 'suede', 'mesh', 'lace', 'polyester', 'nylon', 'spandex', 'jersey', 'fleece', 'canvas'];
  const patternWords = ['striped', 'plaid', 'checkered', 'polka dot', 'floral', 'geometric', 'abstract', 'solid', 'paisley', 'leopard', 'zebra', 'camouflage', 'tie-dye', 'ombre', 'houndstooth', 'tartan', 'gingham'];
  
  const words = fullText.toLowerCase().split(/\s+/);
  
  return items.map(item => {
    const itemWords = item.name.toLowerCase().split(/\s+/);
    
    // Extract components from text context
    const extractedColor = extractFromContext(words, itemWords, colorWords);
    const extractedMaterial = extractFromContext(words, itemWords, materialWords);
    const extractedPattern = extractFromContext(words, itemWords, patternWords);
    
    // Get existing descriptors
    const existingDescriptors = item.descriptors || [];
    
    // Build structured name following: Colour + Clothing Item + Material + Pattern
    const components = [];
    
    // Add color if found
    if (extractedColor) {
      components.push(extractedColor);
    }
    
    // Add the core clothing item (clean it up)
    const coreItem = extractCoreClothingItem(item.name);
    components.push(coreItem);
    
    // Add material if found
    if (extractedMaterial) {
      components.push(extractedMaterial);
    }
    
    // Add pattern if found
    if (extractedPattern) {
      components.push(extractedPattern);
    }
    
    const structuredName = components.join(' ');
    
    // Combine all descriptors
    const allDescriptors = [
      ...existingDescriptors,
      ...(extractedColor ? [extractedColor] : []),
      ...(extractedMaterial ? [extractedMaterial] : []),
      ...(extractedPattern ? [extractedPattern] : [])
    ].filter((desc, index, arr) => arr.indexOf(desc) === index); // Remove duplicates
    
    return {
      ...item,
      name: structuredName,
      descriptors: allDescriptors,
      confidence: item.confidence + (components.length > 2 ? 0.1 : 0) // Boost confidence for more complete descriptions
    };
  });
};

const extractFromContext = (allWords: string[], itemWords: string[], targetWords: string[]): string | null => {
  // Look for target words near the item words
  const itemIndices = itemWords.map(word => allWords.findIndex(w => w.includes(word) || word.includes(w))).filter(i => i !== -1);
  
  if (itemIndices.length === 0) return null;
  
  // Search within 3 words before and after item mentions
  for (const index of itemIndices) {
    for (let i = Math.max(0, index - 3); i <= Math.min(allWords.length - 1, index + 3); i++) {
      const word = allWords[i];
      const found = targetWords.find(target => word.includes(target) || target.includes(word));
      if (found) return found;
    }
  }
  
  return null;
};

const extractCoreClothingItem = (itemName: string): string => {
  // Remove common descriptors to get the core clothing item
  const words = itemName.toLowerCase().split(/\s+/);
  const coreWords = words.filter(word => {
    // Keep words that are likely core clothing items
    return !['black', 'white', 'blue', 'red', 'green', 'cotton', 'leather', 'striped', 'solid'].includes(word) && word.length > 2;
  });
  
  return coreWords.length > 0 ? coreWords.join(' ') : itemName;
};

const removeDuplicates = (items: AIClothingItem[]): AIClothingItem[] => {
  const seen = new Set<string>();
  const unique: AIClothingItem[] = [];
  
  for (const item of items) {
    const key = item.name.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    } else {
      // If we've seen this item, maybe boost the confidence of the existing one
      const existingIndex = unique.findIndex(u => u.name.toLowerCase().replace(/\s+/g, ' ').trim() === key);
      if (existingIndex !== -1) {
        unique[existingIndex].confidence = Math.min(0.98, unique[existingIndex].confidence + 0.05);
      }
    }
  }
  
  return unique;
};
