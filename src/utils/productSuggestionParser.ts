import { Gender } from '@/context/RatingContext';

export interface ProductSuggestion {
  name: string;
  context: string;
  category: string;
  searchTerm: string;
  rationale: string;
}

// Specific product name mappings with gender variants
const SPECIFIC_PRODUCT_NAMES: Record<string, { female: string; male: string }> = {
  // Footwear
  'white sneakers': { female: 'White Leather Sneakers', male: 'White Leather Sneakers' },
  'block heels': { female: 'Block Heel Pumps', male: 'Dress Shoes' },
  'ankle boots': { female: 'Ankle Boots', male: 'Chelsea Boots' },
  'dress shoes': { female: 'Pointed Toe Flats', male: 'Oxford Dress Shoes' },
  'ballet flats': { female: 'Classic Ballet Flats', male: 'Loafers' },
  'strappy sandals': { female: 'Strappy Heeled Sandals', male: 'Leather Sandals' },
  'sandals': { female: 'Strappy Sandals', male: 'Leather Sandals' },
  
  // Accessories
  'statement necklace': { female: 'Statement Gold Necklace', male: 'Chain Necklace' },
  'leather watch': { female: 'Leather Strap Watch', male: 'Leather Strap Watch' },
  'crossbody bag': { female: 'Structured Crossbody Bag', male: 'Messenger Bag' },
  'leather belt': { female: 'Slim Leather Belt', male: 'Brown Leather Belt' },
  'stud earrings': { female: 'Gold Stud Earrings', male: 'Cufflinks' },
  'silk scarf': { female: 'Silk Square Scarf', male: 'Pocket Square' },
  'white cardigan': { female: 'White Knit Cardigan', male: 'White Cardigan' },
  'cardigan': { female: 'Knit Cardigan', male: 'Cardigan Sweater' },
  
  // Clothing
  'structured blazer': { female: 'Tailored Blazer', male: 'Navy Blazer' },
  'button down shirt': { female: 'Crisp White Blouse', male: 'White Button Down Shirt' },
  'midi dress': { female: 'A-Line Midi Dress', male: 'Polo Shirt' },
  'high waisted jeans': { female: 'High-Waisted Dark Jeans', male: 'Straight Leg Jeans' },
  'tailored pants': { female: 'High-Waisted Trousers', male: 'Tailored Chinos' },
  'knit cardigan': { female: 'Oversized Knit Cardigan', male: 'V-Neck Sweater' },
  'fitted top': { female: 'Fitted Blouse', male: 'Fitted T-Shirt' },
  'midi skirt': { female: 'A-Line Midi Skirt', male: 'Chino Shorts' },
  'patterned shirt': { female: 'Patterned Blouse', male: 'Patterned Shirt' },
  'black patterned shirt': { female: 'Black Patterned Blouse', male: 'Black Patterned Shirt' },
  'knee-high socks': { female: 'Knee-High Socks', male: 'Crew Socks' },
};

export const parseProductSuggestions = (
  suggestions: string[], 
  gender: Gender
): ProductSuggestion[] => {
  console.log('Parsing product suggestions from style suggestions only, gender:', gender);
  
  if (!suggestions || suggestions.length === 0) {
    return [];
  }

  const extractedProducts: ProductSuggestion[] = [];
  const seenProducts = new Set<string>();
  
  // Process each suggestion to find specific clothing items
  suggestions.forEach(suggestion => {
    const products = extractProductsFromSuggestion(suggestion, gender);
    products.forEach(product => {
      const key = `${product.searchTerm.toLowerCase()}_${product.rationale.toLowerCase()}`;
      if (!seenProducts.has(key) && extractedProducts.length < 3) {
        seenProducts.add(key);
        extractedProducts.push(product);
      }
    });
  });

  // If we have fewer than 3 products, add smart fallbacks
  if (extractedProducts.length < 3) {
    const fallbackSuggestions = generateStrictFallbacks(suggestions, gender, extractedProducts);
    extractedProducts.push(...fallbackSuggestions);
  }

  // Return exactly 3 suggestions
  return extractedProducts.slice(0, 3);
};

function extractProductsFromSuggestion(suggestion: string, gender: Gender): ProductSuggestion[] {
  const products: ProductSuggestion[] = [];
  
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
        context: generateContextualDescription(category, suggestion),
        category,
        searchTerm,
        rationale
      });
    }
  });

  return products;
}

function cleanProductName(text: string): string {
  return text
    .replace(/\b(?:the|a|an|some|any|your|my|his|her|their)\b/gi, '')
    .replace(/\b(?:that|which|this|these|those)\b/gi, '')
    .replace(/\b(?:very|really|quite|pretty|so|too)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidClothingItem(item: string): boolean {
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
}

function extractStyleRationale(suggestion: string, item: string): string {
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
}

function getSpecificProductName(searchTerm: string, gender: Gender): string {
  const cleanedTerm = searchTerm.toLowerCase().replace(/mens|womens/g, '').trim();
  
  // Check for exact matches first
  if (SPECIFIC_PRODUCT_NAMES[cleanedTerm]) {
    return SPECIFIC_PRODUCT_NAMES[cleanedTerm][gender];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(SPECIFIC_PRODUCT_NAMES)) {
    if (cleanedTerm.includes(key) || key.includes(cleanedTerm)) {
      return value[gender];
    }
  }
  
  // Fallback: format the original term nicely
  return searchTerm
    .replace(/mens|womens/g, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

function createGenderSpecificSearchTerm(productTerm: string, gender: Gender): string {
  const genderModifier = gender === 'male' ? 'mens' : 'womens';
  return `${genderModifier} ${productTerm}`;
}

function categorizeProduct(productName: string): string {
  const words = productName.toLowerCase().split(' ');
  
  if (words.some(w => ['shoe', 'boot', 'sneaker', 'heel', 'flat', 'sandal', 'pump'].includes(w))) {
    return 'footwear';
  }
  if (words.some(w => ['necklace', 'bracelet', 'watch', 'belt', 'bag', 'earring', 'scarf', 'hat'].includes(w))) {
    return 'accessories';
  }
  if (words.some(w => ['jacket', 'blazer', 'cardigan', 'coat'].includes(w))) {
    return 'outerwear';
  }
  if (words.some(w => ['shirt', 'blouse', 'top', 'tee', 'sweater'].includes(w))) {
    return 'tops';
  }
  if (words.some(w => ['pants', 'jean', 'trouser', 'skirt', 'short'].includes(w))) {
    return 'bottoms';
  }
  if (words.some(w => ['dress'].includes(w))) {
    return 'dresses';
  }
  
  return 'fashion';
}

function generateContextualDescription(category: string, suggestionText: string): string {
  const lowerText = suggestionText.toLowerCase();
  
  // Context-aware descriptions based on the suggestion content
  if (lowerText.includes('professional') || lowerText.includes('work')) {
    return 'This piece will enhance your professional appearance and boost confidence in workplace settings.';
  }
  
  if (lowerText.includes('visual interest') || lowerText.includes('interest')) {
    return 'Adding this will create visual interest and prevent your outfit from looking too plain or monotonous.';
  }
  
  if (lowerText.includes('color') || lowerText.includes('coordinate')) {
    return 'This piece will help coordinate your color palette and create a more cohesive, intentional look.';
  }
  
  if (lowerText.includes('proportion') || lowerText.includes('balance')) {
    return 'This will help balance your proportions and create a more flattering overall silhouette.';
  }
  
  // Default descriptions by category
  const defaultDescriptions: Record<string, string> = {
    footwear: 'The right shoes can completely transform your look and provide the perfect foundation.',
    accessories: 'Strategic accessories add personality and polish to elevate your entire outfit.',
    outerwear: 'A well-chosen outer layer adds structure and sophistication to your style.',
    tops: 'The right top creates a strong foundation for your overall look.',
    bottoms: 'Well-fitted bottoms are essential for a polished, put-together appearance.',
    dresses: 'The perfect dress makes getting dressed effortless while looking effortlessly chic.',
    fashion: 'This piece will complement your personal style perfectly.'
  };
  
  return defaultDescriptions[category] || defaultDescriptions.fashion;
}

function generateStrictFallbacks(
  suggestions: string[], 
  gender: Gender, 
  existingSuggestions: ProductSuggestion[]
): ProductSuggestion[] {
  const fallbacks: ProductSuggestion[] = [];
  const existingCategories = new Set(existingSuggestions.map(s => s.category));
  const combinedSuggestionText = suggestions.join(' ').toLowerCase();
  
  // Only add fallbacks if there are clear style needs mentioned but no specific items found
  const needsAccessories = combinedSuggestionText.includes('accessory') || combinedSuggestionText.includes('complete');
  const needsFootwear = combinedSuggestionText.includes('shoe') || combinedSuggestionText.includes('foundation');
  const needsStructure = combinedSuggestionText.includes('structure') || combinedSuggestionText.includes('layer');
  
  // Gender-specific strict fallbacks - only specific clothing items
  const genderFallbacks = gender === 'female' 
    ? [
        { name: 'Gold Stud Earrings', category: 'accessories', searchTerm: 'gold stud earrings', rationale: 'Finishing Touch', condition: needsAccessories },
        { name: 'White Leather Sneakers', category: 'footwear', searchTerm: 'white leather sneakers', rationale: 'Foundation Upgrade', condition: needsFootwear },
        { name: 'Tailored Blazer', category: 'outerwear', searchTerm: 'structured blazer', rationale: 'Professional Polish', condition: needsStructure }
      ]
    : [
        { name: 'Leather Strap Watch', category: 'accessories', searchTerm: 'leather strap watch', rationale: 'Finishing Touch', condition: needsAccessories },
        { name: 'White Leather Sneakers', category: 'footwear', searchTerm: 'white leather sneakers', rationale: 'Foundation Upgrade', condition: needsFootwear },
        { name: 'Navy Blazer', category: 'outerwear', searchTerm: 'casual blazer', rationale: 'Style Elevation', condition: needsStructure }
      ];

  // Add fallbacks only if their condition is met and category isn't filled
  for (const fallback of genderFallbacks) {
    if (fallbacks.length >= 3 - existingSuggestions.length) break;
    
    if (fallback.condition && !existingCategories.has(fallback.category)) {
      const genderSpecificSearchTerm = createGenderSpecificSearchTerm(fallback.searchTerm, gender);
      
      fallbacks.push({
        name: `${fallback.rationale}: ${fallback.name}`,
        context: generateContextualDescription(fallback.category, suggestions.join(' ')),
        category: fallback.category,
        searchTerm: genderSpecificSearchTerm,
        rationale: fallback.rationale
      });
      
      existingCategories.add(fallback.category);
    }
  }

  return fallbacks;
}
