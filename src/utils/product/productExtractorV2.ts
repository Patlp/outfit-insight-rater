
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
  console.log('Extracting products from suggestion:', suggestion);
  const products: ExtractedProductV2[] = [];
  
  // Expanded regex patterns to find more specific clothing items
  const actionPatterns = [
    // "swap for a white cardigan" or "replace with sandals"
    /(?:swap|replace|substitute|change)(?:\s+(?:the|your|this|it))?\s+(?:for|with|to)\s+(?:a|an|some)?\s*([a-zA-Z\s-]{3,35}?)(?:\s+(?:that|which|to|for|instead|would|could)|\.|,|;|$)/gi,
    
    // "try a black patterned shirt" or "consider white sneakers"
    /(?:try|consider|opt for|choose|wear|get|add|include)\s+(?:a|an|some)?\s*([a-zA-Z\s-]{3,35}?)(?:\s+(?:that|which|to|for|instead|would|could)|\.|,|;|$)/gi,
    
    // "add a statement necklace" or "include leather belt"
    /(?:add|include|incorporate|introduce)\s+(?:a|an|some)?\s*([a-zA-Z\s-]{3,35}?)(?:\s+(?:that|which|to|for|would|could)|\.|,|;|$)/gi,
    
    // Direct mentions like "white cardigan would" or "black shoes could"
    /(?:a|an|some)?\s*([a-zA-Z\s-]{3,35}?)\s+(?:would|could|might|will|can)\s+(?:help|improve|enhance|add|complement|work|look|be)/gi,
    
    // "pair with denim jacket" or "go with black boots"
    /(?:pair|match|combine|go)\s+(?:with|alongside)\s+(?:a|an|some)?\s*([a-zA-Z\s-]{3,35}?)(?:\s+(?:that|which|to|for)|\.|,|;|$)/gi,
    
    // "wear light wash jeans" or "choose dark sneakers"
    /(?:wear|choose|select|pick)\s+(?:a|an|some)?\s*([a-zA-Z\s-]{3,35}?)(?:\s+(?:that|which|to|for|instead)|\.|,|;|$)/gi,
    
    // "lighter colored cardigan" or "darker wash jeans"
    /(?:lighter|darker|brighter|softer|bolder)\s+(?:colored?)?\s*([a-zA-Z\s-]{3,35}?)(?:\s+(?:would|could|might)|\.|,|;|$)/gi,
  ];

  const lowerSuggestion = suggestion.toLowerCase();
  console.log('Processing suggestion (lowercase):', lowerSuggestion);
  
  actionPatterns.forEach((pattern, index) => {
    let match;
    pattern.lastIndex = 0; // Reset regex
    
    while ((match = pattern.exec(lowerSuggestion)) !== null && products.length < 3) {
      const extractedItem = match[1]?.trim();
      console.log(`Pattern ${index + 1} matched:`, extractedItem);
      
      if (!extractedItem || extractedItem.length < 3) {
        console.log('Skipping - too short:', extractedItem);
        continue;
      }
      
      const cleanedItem = cleanProductName(extractedItem);
      console.log('Cleaned item:', cleanedItem);
      
      if (!cleanedItem || !isValidClothingItem(cleanedItem)) {
        console.log('Skipping - not valid clothing item:', cleanedItem);
        continue;
      }
      
      // Check for duplicates
      const isDuplicate = products.some(p => 
        p.searchTerm.toLowerCase() === cleanedItem.toLowerCase() ||
        p.name.toLowerCase().includes(cleanedItem.toLowerCase())
      );
      
      if (isDuplicate) {
        console.log('Skipping - duplicate item:', cleanedItem);
        continue;
      }
      
      const rationale = extractStyleRationale(suggestion, cleanedItem);
      const specificName = getSpecificProductName(cleanedItem, gender);
      const searchTerm = createGenderSpecificSearchTerm(cleanedItem, gender);
      const category = categorizeProduct(cleanedItem);
      
      console.log('Creating product:', {
        name: `${rationale}: ${specificName}`,
        category,
        searchTerm,
        rationale
      });
      
      products.push({
        name: `${rationale}: ${specificName}`,
        context: '', // Will be set by context generator
        category,
        searchTerm,
        rationale
      });
    }
  });

  console.log('Extracted products count:', products.length);
  return products;
};

const cleanProductName = (text: string): string => {
  return text
    .replace(/\b(?:the|a|an|some|any|your|my|his|her|their|this|that|these|those)\b/gi, '')
    .replace(/\b(?:very|really|quite|pretty|so|too|more|most|less|least)\b/gi, '')
    .replace(/\b(?:colored?|toned?|style|styled|looking)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const isValidClothingItem = (item: string): boolean => {
  // Expanded clothing keywords for better detection
  const clothingKeywords = [
    // Footwear
    'shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'heel', 'heels', 
    'flat', 'flats', 'sandal', 'sandals', 'pump', 'pumps', 'loafer', 'loafers',
    'oxford', 'oxfords', 'derby', 'chelsea', 'ankle boot', 'combat boot',
    
    // Tops
    'shirt', 'shirts', 'blouse', 'blouses', 'top', 'tops', 'tee', 'tees', 
    'sweater', 'sweaters', 'cardigan', 'cardigans', 'hoodie', 'hoodies',
    'tank', 'tanks', 'camisole', 'polo', 'henley', 'button-down', 'button down',
    
    // Bottoms
    'pants', 'pant', 'jean', 'jeans', 'trouser', 'trousers', 'skirt', 'skirts',
    'short', 'shorts', 'legging', 'leggings', 'jogger', 'joggers', 'chino', 'chinos',
    
    // Dresses
    'dress', 'dresses', 'gown', 'gowns', 'frock', 'midi dress', 'maxi dress',
    
    // Outerwear
    'jacket', 'jackets', 'blazer', 'blazers', 'coat', 'coats', 'vest', 'vests',
    'windbreaker', 'puffer', 'bomber', 'denim jacket', 'leather jacket',
    
    // Accessories
    'necklace', 'necklaces', 'bracelet', 'bracelets', 'watch', 'watches',
    'belt', 'belts', 'bag', 'bags', 'purse', 'purses', 'earring', 'earrings',
    'scarf', 'scarves', 'hat', 'hats', 'cap', 'caps', 'sunglasses', 'glasses',
    'ring', 'rings', 'chain', 'chains', 'pendant', 'brooch',
    
    // Undergarments & basics
    'sock', 'socks', 'stocking', 'stockings', 'tights', 'pantyhose'
  ];
  
  // Exclude non-clothing descriptive words
  const excludeWords = [
    'color', 'colors', 'tone', 'tones', 'shade', 'shades', 'fabric', 'fabrics',
    'material', 'materials', 'texture', 'textures', 'pattern', 'patterns',
    'style', 'styles', 'look', 'looks', 'feel', 'feels', 'fit', 'fits',
    'size', 'sizes', 'length', 'lengths', 'cut', 'cuts', 'design', 'designs',
    'wash', 'washes', 'finish', 'finishes', 'detail', 'details',
    'cotton', 'wool', 'silk', 'linen', 'polyester', 'denim', 'leather',
    'light', 'dark', 'bright', 'soft', 'bold', 'neutral', 'warm', 'cool'
  ];
  
  const words = item.toLowerCase().split(' ');
  const itemLower = item.toLowerCase();
  
  // Check if it contains excluded words only
  if (excludeWords.some(exclude => itemLower === exclude || words.every(word => excludeWords.includes(word)))) {
    console.log('Excluded descriptive word:', item);
    return false;
  }
  
  // Check if it contains any clothing keywords
  const hasClothingKeyword = words.some(word => 
    clothingKeywords.some(keyword => 
      word.includes(keyword) || keyword.includes(word) || 
      // Handle compound words
      (keyword.includes(' ') && itemLower.includes(keyword))
    )
  );
  
  console.log('Clothing validation for:', item, 'Result:', hasClothingKeyword);
  return hasClothingKeyword;
};

const extractStyleRationale = (suggestion: string, item: string): string => {
  const lowerSuggestion = suggestion.toLowerCase();
  
  // Look for style reasons in the suggestion with expanded patterns
  if (lowerSuggestion.includes('visual interest') || lowerSuggestion.includes('add interest') || lowerSuggestion.includes('more interesting')) {
    return 'Visual Interest';
  }
  if (lowerSuggestion.includes('professional') || lowerSuggestion.includes('work') || lowerSuggestion.includes('office')) {
    return 'Professional Polish';
  }
  if (lowerSuggestion.includes('color') || lowerSuggestion.includes('coordinate') || lowerSuggestion.includes('complement')) {
    return 'Color Coordination';
  }
  if (lowerSuggestion.includes('proportion') || lowerSuggestion.includes('balance') || lowerSuggestion.includes('flattering')) {
    return 'Better Proportions';
  }
  if (lowerSuggestion.includes('casual') || lowerSuggestion.includes('relax') || lowerSuggestion.includes('comfortable')) {
    return 'Casual Refinement';
  }
  if (lowerSuggestion.includes('elevate') || lowerSuggestion.includes('upgrade') || lowerSuggestion.includes('polished')) {
    return 'Style Elevation';
  }
  if (lowerSuggestion.includes('texture') || lowerSuggestion.includes('material') || lowerSuggestion.includes('fabric')) {
    return 'Texture Balance';
  }
  if (lowerSuggestion.includes('accessorize') || lowerSuggestion.includes('complete') || lowerSuggestion.includes('finishing touch')) {
    return 'Complete Look';
  }
  if (lowerSuggestion.includes('structure') || lowerSuggestion.includes('structured') || lowerSuggestion.includes('tailored')) {
    return 'Structure Addition';
  }
  if (lowerSuggestion.includes('layer') || lowerSuggestion.includes('layering') || lowerSuggestion.includes('depth')) {
    return 'Layer Addition';
  }
  
  // Default rationales based on item type
  const itemLower = item.toLowerCase();
  if (itemLower.includes('shoe') || itemLower.includes('sneaker') || itemLower.includes('boot') || itemLower.includes('sandal')) {
    return 'Foundation Upgrade';
  }
  if (itemLower.includes('necklace') || itemLower.includes('bracelet') || itemLower.includes('earring') || itemLower.includes('watch') || itemLower.includes('belt')) {
    return 'Finishing Touch';
  }
  if (itemLower.includes('cardigan') || itemLower.includes('blazer') || itemLower.includes('jacket') || itemLower.includes('coat')) {
    return 'Layer Addition';
  }
  if (itemLower.includes('bag') || itemLower.includes('purse') || itemLower.includes('scarf')) {
    return 'Complete Look';
  }
  
  return 'Style Enhancement';
};
