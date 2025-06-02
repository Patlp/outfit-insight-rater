
import { Gender } from '@/context/RatingContext';
import { createGenderSpecificSearchTerm } from './searchTermGenerator';
import { categorizeProduct } from './productClassifier';
import { getSpecificProductName } from './productNameMapper';

export interface ExtractedProductV3 {
  name: string;
  context: string;
  category: string;
  searchTerm: string;
  rationale: string;
}

export const extractProductsFromSuggestion = (suggestion: string, gender: Gender): ExtractedProductV3[] => {
  console.log('=== EXTRACTING PRODUCTS V3 ===');
  console.log('Suggestion:', suggestion);
  console.log('Gender:', gender);
  
  const products: ExtractedProductV3[] = [];
  const lowerSuggestion = suggestion.toLowerCase();
  
  // Enhanced and more precise regex patterns
  const actionPatterns = [
    // Direct action with specific clothing items: "try white sneakers", "add a blazer"
    /(?:try|add|wear|choose|opt for|consider|include|incorporate|get)\s+(?:a|an|some)?\s*([a-zA-Z]+(?:\s+[a-zA-Z]+){0,3}?(?:shirt|blouse|top|dress|pants|jeans|skirt|jacket|blazer|cardigan|coat|shoes|sneakers|boots|heels|flats|sandals|belt|necklace|bracelet|watch|bag|purse|hat|scarf|earrings))\b/gi,
    
    // Replacement patterns: "swap for dark jeans", "replace with a blazer"
    /(?:swap|replace|substitute|change)(?:\s+(?:the|your|this|it))?\s+(?:for|with|to)\s+(?:a|an|some)?\s*([a-zA-Z]+(?:\s+[a-zA-Z]+){0,3}?(?:shirt|blouse|top|dress|pants|jeans|skirt|jacket|blazer|cardigan|coat|shoes|sneakers|boots|heels|flats|sandals|belt|necklace|bracelet|watch|bag|purse|hat|scarf|earrings))\b/gi,
    
    // Pairing patterns: "pair with ankle boots", "match with a cardigan"
    /(?:pair|match|combine|go)\s+(?:with|alongside)\s+(?:a|an|some)?\s*([a-zA-Z]+(?:\s+[a-zA-Z]+){0,3}?(?:shirt|blouse|top|dress|pants|jeans|skirt|jacket|blazer|cardigan|coat|shoes|sneakers|boots|heels|flats|sandals|belt|necklace|bracelet|watch|bag|purse|hat|scarf|earrings))\b/gi,
    
    // Fabric-based clothing suggestions: "cotton shirt", "linen pants", "denim jacket"
    /(?:cotton|linen|denim|wool|silk|leather|knit|cashmere)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,2}?(?:shirt|blouse|top|dress|pants|jeans|skirt|jacket|blazer|cardigan|coat|shoes|sneakers|boots))\b/gi,
    
    // Color-based clothing: "white sneakers", "black blazer", "navy pants"
    /(?:white|black|blue|red|green|yellow|pink|purple|brown|gray|grey|navy|beige|cream|tan|dark|light)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,2}?(?:shirt|blouse|top|dress|pants|jeans|skirt|jacket|blazer|cardigan|coat|shoes|sneakers|boots|heels|flats|sandals|belt|necklace|bracelet|watch|bag|purse|hat|scarf))\b/gi,
    
    // Style-based clothing: "fitted top", "tailored pants", "structured blazer"
    /(?:fitted|loose|tailored|structured|casual|formal|dressy|relaxed)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,2}?(?:shirt|blouse|top|dress|pants|jeans|skirt|jacket|blazer|cardigan|coat|shoes|sneakers|boots|heels|flats|sandals))\b/gi,
  ];

  // Process each pattern
  actionPatterns.forEach((pattern, index) => {
    let match;
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(lowerSuggestion)) !== null && products.length < 5) {
      const extractedItem = match[1]?.trim();
      console.log(`Pattern ${index + 1} found:`, extractedItem);
      
      if (!extractedItem || extractedItem.length < 3) {
        console.log('Skipping - too short:', extractedItem);
        continue;
      }
      
      const cleanedItem = cleanProductName(extractedItem);
      console.log('Cleaned item:', cleanedItem);
      
      if (!cleanedItem || !isValidClothingItem(cleanedItem)) {
        console.log('Skipping - not valid clothing:', cleanedItem);
        continue;
      }
      
      // Enhanced duplicate checking
      const isDuplicate = products.some(p => 
        areSimilarProducts(p.searchTerm.toLowerCase(), cleanedItem.toLowerCase())
      );
      
      if (isDuplicate) {
        console.log('Skipping - duplicate:', cleanedItem);
        continue;
      }
      
      const rationale = extractStyleRationale(suggestion, cleanedItem);
      const specificName = getSpecificProductName(cleanedItem, gender);
      const searchTerm = createGenderSpecificSearchTerm(cleanedItem, gender);
      const category = categorizeProduct(cleanedItem);
      
      const product = {
        name: `${rationale}: ${specificName}`,
        context: '', // Will be set by context generator
        category,
        searchTerm,
        rationale
      };
      
      console.log('Adding product:', product);
      products.push(product);
    }
  });

  // Handle fabric-only suggestions (e.g., "cotton" -> "cotton shirt")
  const fabricSuggestions = extractFabricSuggestions(suggestion, gender);
  fabricSuggestions.forEach(product => {
    if (products.length < 3 && !products.some(p => areSimilarProducts(p.searchTerm, product.searchTerm))) {
      products.push(product);
    }
  });

  console.log(`Found ${products.length} products from suggestion`);
  return products.slice(0, 3);
};

const cleanProductName = (text: string): string => {
  return text
    .replace(/\b(?:the|a|an|some|any|your|my|his|her|their|this|that|these|those)\b/gi, '')
    .replace(/\b(?:very|really|quite|pretty|so|too|more|most|less|least|such)\b/gi, '')
    .replace(/\b(?:would|could|might|will|can|should|may)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const isValidClothingItem = (item: string): boolean => {
  const clothingTerms = [
    'shirt', 'blouse', 'top', 'tee', 't-shirt', 'sweater', 'cardigan', 'hoodie', 'pullover',
    'tank', 'camisole', 'polo', 'henley', 'jersey', 'tunic',
    'pants', 'jeans', 'trouser', 'trousers', 'skirt', 'shorts', 'leggings', 'joggers', 'chinos',
    'dress', 'gown', 'frock', 'jumpsuit', 'romper', 'playsuit',
    'jacket', 'blazer', 'coat', 'vest', 'windbreaker', 'puffer', 'bomber', 'parka',
    'shoes', 'sneakers', 'boots', 'heels', 'flats', 'sandals', 'pumps', 'loafers', 'oxfords',
    'necklace', 'bracelet', 'watch', 'belt', 'bag', 'purse', 'earrings', 'scarf', 'hat'
  ];
  
  const itemLower = item.toLowerCase();
  return clothingTerms.some(term => itemLower.includes(term));
};

const areSimilarProducts = (product1: string, product2: string): boolean => {
  const words1 = product1.split(' ');
  const words2 = product2.split(' ');
  
  // Check if they share significant words
  const commonWords = words1.filter(word => words2.includes(word) && word.length > 2);
  return commonWords.length >= Math.min(words1.length, words2.length) / 2;
};

const extractFabricSuggestions = (suggestion: string, gender: Gender): ExtractedProductV3[] => {
  const fabricMentions = [
    { fabric: 'cotton', items: ['shirt', 'top', 'dress'] },
    { fabric: 'linen', items: ['shirt', 'pants', 'dress'] },
    { fabric: 'denim', items: ['jacket', 'jeans'] },
    { fabric: 'wool', items: ['sweater', 'coat'] },
    { fabric: 'silk', items: ['blouse', 'scarf'] },
    { fabric: 'leather', items: ['jacket', 'belt', 'shoes'] },
    { fabric: 'knit', items: ['sweater', 'cardigan'] },
    { fabric: 'cashmere', items: ['sweater', 'scarf'] }
  ];
  
  const products: ExtractedProductV3[] = [];
  const lowerSuggestion = suggestion.toLowerCase();
  
  for (const { fabric, items } of fabricMentions) {
    if (lowerSuggestion.includes(fabric) && !lowerSuggestion.includes(`${fabric} `)) {
      // Only if fabric is mentioned alone, not as part of a specific item
      const bestItem = items[0]; // Use the most common item for this fabric
      const productName = `${fabric} ${bestItem}`;
      
      products.push({
        name: `Breathable Choice: ${getSpecificProductName(productName, gender)}`,
        context: '',
        category: categorizeProduct(bestItem),
        searchTerm: createGenderSpecificSearchTerm(productName, gender),
        rationale: 'Breathable Choice'
      });
      break; // Only add one fabric suggestion
    }
  }
  
  return products;
};

const extractStyleRationale = (suggestion: string, item: string): string => {
  const lowerSuggestion = suggestion.toLowerCase();
  
  const rationaleMap = [
    { keywords: ['breathable', 'cotton', 'linen', 'air', 'cool', 'comfortable'], rationale: 'Breathable Choice' },
    { keywords: ['professional', 'work', 'office', 'business', 'formal'], rationale: 'Professional Polish' },
    { keywords: ['casual', 'relaxed', 'comfortable', 'laid-back', 'easy'], rationale: 'Casual Refinement' },
    { keywords: ['structure', 'structured', 'tailored', 'fitted', 'sharp'], rationale: 'Structure Addition' },
    { keywords: ['layer', 'layering', 'warmth', 'coverage'], rationale: 'Layer Addition' },
    { keywords: ['color', 'coordinate', 'complement', 'palette'], rationale: 'Color Coordination' },
    { keywords: ['elevate', 'upgrade', 'polished', 'sophisticated'], rationale: 'Style Elevation' },
    { keywords: ['accessory', 'complete', 'finishing', 'detail'], rationale: 'Complete Look' },
    { keywords: ['foundation', 'base', 'anchor'], rationale: 'Foundation Upgrade' }
  ];

  for (const { keywords, rationale } of rationaleMap) {
    if (keywords.some(keyword => lowerSuggestion.includes(keyword))) {
      return rationale;
    }
  }
  
  // Item-based fallback
  const itemLower = item.toLowerCase();
  if (itemLower.includes('shoe') || itemLower.includes('sneaker') || itemLower.includes('boot')) {
    return 'Foundation Upgrade';
  }
  if (itemLower.includes('necklace') || itemLower.includes('bracelet') || itemLower.includes('watch') || itemLower.includes('belt')) {
    return 'Finishing Touch';
  }
  if (itemLower.includes('cardigan') || itemLower.includes('blazer') || itemLower.includes('jacket')) {
    return 'Layer Addition';
  }
  
  return 'Style Enhancement';
};
