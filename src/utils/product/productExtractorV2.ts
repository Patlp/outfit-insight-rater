
import { Gender } from '@/context/RatingContext';
import { createGenderSpecificSearchTerm } from './searchTermGenerator';
import { categorizeProduct } from './productClassifier';
import { getSpecificProductName } from './productNameMapper';

export interface ExtractedProductV2 {
  name: string;
  context: string;
  category: string;
  searchTerm: string;
  rationale: string;
}

export const extractProductsFromSuggestion = (suggestion: string, gender: Gender): ExtractedProductV2[] => {
  const products: ExtractedProductV2[] = [];
  
  // Regex patterns to find specific clothing items with action phrases
  const actionPatterns = [
    // "swap for a white cardigan" or "replace with sandals"
    /(?:swap|replace|substitute)(?:\s+(?:the|your|this))?\s+(?:for|with)\s+(?:a|an|some)?\s*([a-zA-Z\s]{3,30}?)(?:\s+(?:that|which|to|for|instead)|\.|,|$)/gi,
    
    // "try a black patterned shirt" or "consider white sneakers"
    /(?:try|consider|opt for|choose|wear)\s+(?:a|an|some)?\s*([a-zA-Z\s]{3,30}?)(?:\s+(?:that|which|to|for|instead)|\.|,|$)/gi,
    
    // "add a statement necklace" or "include leather belt"
    /(?:add|include|incorporate)\s+(?:a|an|some)?\s*([a-zA-Z\s]{3,30}?)(?:\s+(?:that|which|to|for)|\.|,|$)/gi,
    
    // Direct mentions like "white cardigan would" or "black shoes could"
    /([a-zA-Z\s]{3,30}?)\s+(?:would|could|might|will)\s+(?:help|improve|enhance|add|complement)/gi,
  ];

  const lowerSuggestion = suggestion.toLowerCase();
  
  actionPatterns.forEach(pattern => {
    let match;
    pattern.lastIndex = 0; // Reset regex
    
    while ((match = pattern.exec(lowerSuggestion)) !== null && products.length < 2) {
      const extractedItem = match[1]?.trim();
      if (!extractedItem || extractedItem.length < 3) continue;
      
      const cleanedItem = cleanProductName(extractedItem);
      if (!cleanedItem || !isValidClothingItem(cleanedItem)) continue;
      
      const rationale = extractStyleRationale(suggestion, cleanedItem);
      const specificName = getSpecificProductName(cleanedItem, gender);
      const searchTerm = createGenderSpecificSearchTerm(cleanedItem, gender);
      const category = categorizeProduct(cleanedItem);
      
      products.push({
        name: `${rationale}: ${specificName}`,
        context: '', // Will be set by context generator
        category,
        searchTerm,
        rationale
      });
    }
  });

  return products;
};

const cleanProductName = (text: string): string => {
  return text
    .replace(/\b(?:the|a|an|some|any|your|my|his|her|their)\b/gi, '')
    .replace(/\b(?:that|which|this|these|those)\b/gi, '')
    .replace(/\b(?:very|really|quite|pretty|so|too)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const isValidClothingItem = (item: string): boolean => {
  const clothingKeywords = [
    'shoe', 'sneaker', 'boot', 'heel', 'flat', 'sandal', 'pump',
    'shirt', 'blouse', 'top', 'tee', 'sweater', 'cardigan',
    'pants', 'jean', 'trouser', 'skirt', 'short', 'dress',
    'jacket', 'blazer', 'coat', 'cardigan',
    'necklace', 'bracelet', 'watch', 'belt', 'bag', 'purse', 'earring', 'scarf', 'hat',
    'sock', 'stocking'
  ];
  
  const words = item.toLowerCase().split(' ');
  return words.some(word => 
    clothingKeywords.some(keyword => 
      word.includes(keyword) || keyword.includes(word)
    )
  );
};

const extractStyleRationale = (suggestion: string, item: string): string => {
  const lowerSuggestion = suggestion.toLowerCase();
  
  // Look for style reasons in the suggestion
  if (lowerSuggestion.includes('visual interest') || lowerSuggestion.includes('interest')) {
    return 'Visual Interest';
  }
  if (lowerSuggestion.includes('professional') || lowerSuggestion.includes('work')) {
    return 'Professional Polish';
  }
  if (lowerSuggestion.includes('color') || lowerSuggestion.includes('coordinate')) {
    return 'Color Coordination';
  }
  if (lowerSuggestion.includes('proportion') || lowerSuggestion.includes('balance')) {
    return 'Better Proportions';
  }
  if (lowerSuggestion.includes('casual') || lowerSuggestion.includes('relax')) {
    return 'Casual Refinement';
  }
  if (lowerSuggestion.includes('elevate') || lowerSuggestion.includes('upgrade')) {
    return 'Style Elevation';
  }
  if (lowerSuggestion.includes('texture') || lowerSuggestion.includes('material')) {
    return 'Texture Balance';
  }
  if (lowerSuggestion.includes('accessorize') || lowerSuggestion.includes('complete')) {
    return 'Complete Look';
  }
  
  // Default rationales based on item type
  const itemLower = item.toLowerCase();
  if (itemLower.includes('shoe') || itemLower.includes('sneaker') || itemLower.includes('boot')) {
    return 'Foundation Upgrade';
  }
  if (itemLower.includes('accessory') || itemLower.includes('necklace') || itemLower.includes('belt')) {
    return 'Finishing Touch';
  }
  if (itemLower.includes('cardigan') || itemLower.includes('blazer') || itemLower.includes('jacket')) {
    return 'Layer Addition';
  }
  
  return 'Style Enhancement';
};
