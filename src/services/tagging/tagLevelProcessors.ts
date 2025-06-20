

import { extractClothingItems, categorizeClothingItem } from '@/utils/clothingExtractor';
import { extractClothingPhrasesAI, AIClothingItem } from '@/services/clothingExtractionService';
import { enhancedClothingMatcher, convertToAIClothingItems } from '@/services/enhancedClothingMatcher';
import { fashionpediaClothingMatcher } from '@/services/fashionpediaClothingMatcher';
import { TaggingConfig } from '@/types/tagging';
import { applyStructuredFormat } from './structuredFormatting';
import { filterIndividualClothingItems, removeDuplicates } from './itemFilters';
import { extractItemsFromStyle } from './styleParser';

export const processBasicTagging = async (
  feedback: string, 
  suggestions: string[], 
  config: TaggingConfig
): Promise<AIClothingItem[]> => {
  console.log('Processing with BASIC tagging...');
  
  // Extract style references for validation
  const styleReferences = extractItemsFromStyle(feedback);
  
  const regexResults = extractClothingItems(feedback);
  const items: AIClothingItem[] = regexResults.map(item => ({
    name: item,
    descriptors: [],
    category: categorizeClothingItem(item),
    confidence: 0.7,
    source: 'regex'
  }));

  // Apply strict filtering with style validation
  const filteredItems = filterIndividualClothingItems(items, styleReferences);

  return filteredItems.slice(0, config.maxItems);
};

export const processMediumTagging = async (
  feedback: string,
  suggestions: string[],
  wardrobeItemId: string,
  config: TaggingConfig
): Promise<AIClothingItem[]> => {
  console.log('Processing with MEDIUM tagging...');
  
  // Extract style references for validation
  const styleReferences = extractItemsFromStyle(feedback);
  
  // Try AI extraction first
  const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
  
  if (aiResult.success && aiResult.extractedItems && aiResult.extractedItems.length > 0) {
    const structuredItems = await applyStructuredFormat(aiResult.extractedItems, feedback, styleReferences);
    const filteredItems = filterIndividualClothingItems(structuredItems, styleReferences);
    return filteredItems.slice(0, config.maxItems);
  }

  // Fallback to basic if AI fails
  console.log('AI extraction failed, falling back to basic...');
  return processBasicTagging(feedback, suggestions, config);
};

export const processAdvancedTagging = async (
  feedback: string,
  suggestions: string[],
  wardrobeItemId: string,
  config: TaggingConfig
): Promise<AIClothingItem[]> => {
  console.log('=== PROCESSING ADVANCED TAGGING WITH STRICT VALIDATION ===');
  console.log('Enforcing STRICT rules: 2-word max, 90% confidence, Style section cross-check');
  
  const fullText = [feedback, ...suggestions].join(' ');
  
  // Step 1: Extract Style section references for validation
  const styleReferences = extractItemsFromStyle(feedback);
  console.log(`Style references found: ${styleReferences.length}`);
  
  const allItems: AIClothingItem[] = [];
  
  // Step 2: Enhanced matching with Kaggle dataset
  console.log('Step 2: Enhanced Kaggle dataset matching...');
  try {
    const enhancedMatches = await enhancedClothingMatcher(fullText, 'neutral');
    const enhancedItems = convertToAIClothingItems(enhancedMatches);
    
    if (enhancedItems.length > 0) {
      console.log(`✅ Enhanced matching found ${enhancedItems.length} items`);
      allItems.push(...enhancedItems.map(item => ({
        ...item,
        source: 'kaggle-enhanced',
        confidence: item.confidence * 0.95
      })));
    }
  } catch (error) {
    console.warn('Enhanced matching failed:', error);
  }

  // Step 3: Fashionpedia dataset matching
  console.log('Step 3: Fashionpedia dataset matching...');
  try {
    const fashionpediaMatches = await fashionpediaClothingMatcher(fullText, 5);
    
    if (fashionpediaMatches.length > 0) {
      console.log(`✅ Fashionpedia matching found ${fashionpediaMatches.length} items`);
      allItems.push(...fashionpediaMatches.map(match => ({
        name: match.name,
        descriptors: match.description ? [match.description] : [],
        category: match.category,
        confidence: match.confidence * 0.85,
        source: 'fashionpedia',
        fashionpediaData: match.fashionpediaData
      })));
    }
  } catch (error) {
    console.warn('Fashionpedia matching failed:', error);
  }

  // Step 4: AI extraction
  console.log('Step 4: AI extraction...');
  try {
    const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
    
    if (aiResult.success && aiResult.extractedItems && aiResult.extractedItems.length > 0) {
      console.log(`✅ AI extraction found ${aiResult.extractedItems.length} items`);
      allItems.push(...aiResult.extractedItems.map(item => ({
        ...item,
        source: 'ai-structured',
        confidence: item.confidence * 0.9
      })));
    }
  } catch (error) {
    console.warn('AI extraction failed:', error);
  }

  // Step 5: Apply STRICT structured format with Style validation
  console.log('Step 5: Applying structured format with Style validation...');
  const structuredItems = await applyStructuredFormat(allItems, fullText, styleReferences);

  // Step 6: Apply STRICT individual item filtering with enhanced validation
  console.log('Step 6: Applying strict validation (90% confidence, 2-word max, Style cross-check)...');
  const validatedItems = filterIndividualClothingItems(structuredItems, styleReferences);

  // Step 7: Remove duplicates and rank by confidence
  const deduplicatedItems = removeDuplicates(validatedItems);
  
  // Step 8: Sort by confidence and limit results
  const finalItems = deduplicatedItems
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, config.maxItems);

  console.log(`=== ADVANCED TAGGING COMPLETE ===`);
  console.log(`Total items from all datasets: ${allItems.length}`);
  console.log(`After structured formatting: ${structuredItems.length}`);
  console.log(`After strict validation: ${validatedItems.length}`);
  console.log(`After deduplication: ${deduplicatedItems.length}`);
  console.log(`Final items: ${finalItems.length}`);

  finalItems.forEach((item, index) => {
    const wordCount = item.name.split(' ').length;
    console.log(`${index + 1}. "${item.name}" (${wordCount} words, ${item.source}, confidence: ${item.confidence.toFixed(2)})`);
  });

  return finalItems;
};

