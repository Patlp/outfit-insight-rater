

import { AIClothingItem } from '@/services/clothingExtractionService';
import { categorizeClothingItem } from '@/utils/clothingExtractor';
import { StyleReference } from './styleParser';
import { applyStrictValidation } from './enhancedValidator';

export const filterIndividualClothingItems = (
  items: AIClothingItem[], 
  styleReferences: StyleReference[] = []
): AIClothingItem[] => {
  console.log('=== FILTERING WITH ENHANCED STRICT VALIDATION ===');
  console.log(`Input: ${items.length} items, Style references: ${styleReferences.length}`);
  
  // Apply the new strict validation system
  const validatedItems = applyStrictValidation(items, styleReferences);
  
  // Additional cleaning and deduplication
  const cleanedItems = validatedItems
    .map(item => cleanAndValidateItem(item))
    .filter(item => item !== null) as AIClothingItem[];
  
  // Remove duplicates
  const finalItems = removeDuplicates(cleanedItems);
  
  console.log(`=== FILTERING COMPLETE: ${finalItems.length}/${items.length} items passed all validation ===`);
  return finalItems;
};

export const cleanAndValidateItem = (item: AIClothingItem): AIClothingItem | null => {
  let cleanName = item.name;
  
  // Clean up any remaining formatting issues
  cleanName = cleanName.replace(/^(the|a|an)\s+/i, '');
  cleanName = cleanName.replace(/\s+/g, ' ').trim();
  
  // Final word count check
  const words = cleanName.split(' ').filter(word => word.length > 0);
  if (words.length > 2) {
    console.log(`❌ Still too many words after cleaning: "${cleanName}" (${words.length} words)`);
    return null;
  }
  
  if (words.length === 0) {
    console.log(`❌ No words left after cleaning: "${item.name}"`);
    return null;
  }
  
  // Ensure proper capitalization
  cleanName = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return {
    ...item,
    name: cleanName,
    category: categorizeClothingItem(cleanName.toLowerCase())
  };
};

export const removeDuplicates = (items: AIClothingItem[]): AIClothingItem[] => {
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

