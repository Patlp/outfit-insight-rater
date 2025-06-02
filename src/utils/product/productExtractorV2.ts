
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
  console.log('=== EXTRACTING PRODUCTS ===');
  console.log('Suggestion:', suggestion);
  console.log('Gender:', gender);
  
  const products: ExtractedProductV2[] = [];
  
  // Enhanced regex patterns with more comprehensive coverage
  const actionPatterns = [
    // Direct action patterns: "try a white cardigan", "add dark jeans"
    /(?:try|add|wear|choose|opt for|consider|include|incorporate|get)\s+(?:a|an|some)?\s*([a-zA-Z\s-]{3,40}?)(?:\s+(?:that|which|to|for|instead|would|could|might)|\.|,|;|$)/gi,
    
    // Replacement patterns: "swap for sandals", "replace with blazer"
    /(?:swap|replace|substitute|change)(?:\s+(?:the|your|this|it))?\s+(?:for|with|to)\s+(?:a|an|some)?\s*([a-zA-Z\s-]{3,40}?)(?:\s+(?:that|which|to|for|would|could)|\.|,|;|$)/gi,
    
    // Pairing patterns: "pair with black boots", "match with cardigan"
    /(?:pair|match|combine|go)\s+(?:with|alongside)\s+(?:a|an|some)?\s*([a-zA-Z\s-]{3,40}?)(?:\s+(?:that|which|to|for)|\.|,|;|$)/gi,
    
    // Suggestion patterns: "cardigan would help", "blazer could work"
    /(?:a|an|some)?\s*([a-zA-Z\s-]{3,40}?)\s+(?:would|could|might|will|can)\s+(?:help|improve|enhance|add|complement|work|look|be|provide)/gi,
    
    // Color/style modification: "lighter cardigan", "darker jeans", "fitted top"
    /(?:lighter|darker|brighter|softer|bolder|fitted|loose|structured|tailored|casual|formal)\s+(?:colored?)?\s*([a-zA-Z\s-]{3,40}?)(?:\s+(?:would|could|might)|\.|,|;|$)/gi,
    
    // Direct clothing mentions: "white sneakers", "black blazer"
    /\b(?:white|black|blue|red|green|yellow|pink|purple|brown|gray|grey|navy|beige|cream|tan)\s+([a-zA-Z\s-]{3,40}?)(?:\s+(?:would|could|might|that|which)|\.|,|;|$)/gi,
    
    // Material-based: "leather jacket", "denim shirt", "cotton cardigan"
    /\b(?:leather|denim|cotton|wool|silk|linen|knit|velvet|cashmere)\s+([a-zA-Z\s-]{3,40}?)(?:\s+(?:would|could|might|that|which)|\.|,|;|$)/gi,
  ];

  const lowerSuggestion = suggestion.toLowerCase();
  console.log('Processing suggestion (lowercase):', lowerSuggestion);
  
  actionPatterns.forEach((pattern, index) => {
    let match;
    pattern.lastIndex = 0; // Reset regex
    
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
        p.searchTerm.toLowerCase().includes(cleanedItem.toLowerCase()) ||
        cleanedItem.toLowerCase().includes(p.searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(cleanedItem.toLowerCase())
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

  console.log(`Found ${products.length} products from suggestion`);
  return products.slice(0, 3); // Limit to 3 products
};

const cleanProductName = (text: string): string => {
  return text
    .replace(/\b(?:the|a|an|some|any|your|my|his|her|their|this|that|these|those)\b/gi, '')
    .replace(/\b(?:very|really|quite|pretty|so|too|more|most|less|least|such)\b/gi, '')
    .replace(/\b(?:colored?|toned?|style|styled|looking|type|kind)\b/gi, '')
    .replace(/\b(?:would|could|might|will|can|should|may)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const isValidClothingItem = (item: string): boolean => {
  // Comprehensive clothing keywords organized by category
  const clothingKeywords = [
    // Footwear
    'shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'heel', 'heels', 
    'flat', 'flats', 'sandal', 'sandals', 'pump', 'pumps', 'loafer', 'loafers',
    'oxford', 'oxfords', 'derby', 'chelsea', 'ankle boot', 'combat boot', 'running shoe',
    
    // Tops
    'shirt', 'shirts', 'blouse', 'blouses', 'top', 'tops', 'tee', 'tees', 't-shirt',
    'sweater', 'sweaters', 'cardigan', 'cardigans', 'hoodie', 'hoodies', 'pullover',
    'tank', 'tanks', 'camisole', 'polo', 'henley', 'button-down', 'button down',
    'jersey', 'tunic', 'crop top', 'tube top',
    
    // Bottoms
    'pants', 'pant', 'jean', 'jeans', 'trouser', 'trousers', 'skirt', 'skirts',
    'short', 'shorts', 'legging', 'leggings', 'jogger', 'joggers', 'chino', 'chinos',
    'slacks', 'capri', 'palazzo', 'wide leg', 'skinny', 'straight leg', 'bootcut',
    
    // Dresses & One-pieces
    'dress', 'dresses', 'gown', 'gowns', 'frock', 'midi dress', 'maxi dress',
    'mini dress', 'cocktail dress', 'sundress', 'wrap dress', 'shift dress',
    'jumpsuit', 'romper', 'playsuit', 'overall', 'overalls',
    
    // Outerwear
    'jacket', 'jackets', 'blazer', 'blazers', 'coat', 'coats', 'vest', 'vests',
    'windbreaker', 'puffer', 'bomber', 'denim jacket', 'leather jacket',
    'trench coat', 'peacoat', 'raincoat', 'parka', 'cardigan coat',
    
    // Accessories
    'necklace', 'necklaces', 'bracelet', 'bracelets', 'watch', 'watches',
    'belt', 'belts', 'bag', 'bags', 'purse', 'purses', 'earring', 'earrings',
    'scarf', 'scarves', 'hat', 'hats', 'cap', 'caps', 'sunglasses', 'glasses',
    'ring', 'rings', 'chain', 'chains', 'pendant', 'brooch', 'pin',
    'backpack', 'tote', 'clutch', 'crossbody', 'messenger bag', 'handbag',
    
    // Undergarments & basics
    'sock', 'socks', 'stocking', 'stockings', 'tights', 'pantyhose', 'hosiery'
  ];
  
  // Enhanced exclusion list
  const excludeWords = [
    'color', 'colors', 'tone', 'tones', 'shade', 'shades', 'fabric', 'fabrics',
    'material', 'materials', 'texture', 'textures', 'pattern', 'patterns',
    'style', 'styles', 'look', 'looks', 'feel', 'feels', 'fit', 'fits',
    'size', 'sizes', 'length', 'lengths', 'cut', 'cuts', 'design', 'designs',
    'wash', 'washes', 'finish', 'finishes', 'detail', 'details', 'piece', 'pieces',
    'item', 'items', 'thing', 'things', 'something', 'anything', 'everything',
    'outfit', 'outfits', 'ensemble', 'wardrobe', 'clothing', 'clothes',
    'cotton', 'wool', 'silk', 'linen', 'polyester', 'denim', 'leather',
    'light', 'dark', 'bright', 'soft', 'bold', 'neutral', 'warm', 'cool',
    'casual', 'formal', 'dressy', 'professional', 'smart', 'elegant'
  ];
  
  const words = item.toLowerCase().split(' ');
  const itemLower = item.toLowerCase();
  
  // Skip if it's only excluded words
  if (words.every(word => excludeWords.includes(word))) {
    console.log('Item contains only excluded words:', item);
    return false;
  }
  
  // Check for clothing keywords with improved matching
  const hasClothingKeyword = clothingKeywords.some(keyword => {
    // Exact match or contains keyword
    if (itemLower === keyword || itemLower.includes(keyword) || keyword.includes(itemLower)) {
      return true;
    }
    
    // Check individual words
    return words.some(word => {
      return word === keyword || word.includes(keyword) || keyword.includes(word);
    });
  });
  
  console.log(`Clothing validation for "${item}":`, hasClothingKeyword);
  return hasClothingKeyword;
};

const extractStyleRationale = (suggestion: string, item: string): string => {
  const lowerSuggestion = suggestion.toLowerCase();
  
  // Enhanced rationale detection with more patterns
  const rationaleMap = [
    { keywords: ['visual interest', 'add interest', 'more interesting', 'dynamic'], rationale: 'Visual Interest' },
    { keywords: ['professional', 'work', 'office', 'business', 'formal'], rationale: 'Professional Polish' },
    { keywords: ['color', 'coordinate', 'complement', 'palette', 'tone'], rationale: 'Color Coordination' },
    { keywords: ['proportion', 'balance', 'flattering', 'silhouette', 'shape'], rationale: 'Better Proportions' },
    { keywords: ['casual', 'relax', 'comfortable', 'laid-back', 'easy'], rationale: 'Casual Refinement' },
    { keywords: ['elevate', 'upgrade', 'polished', 'sophisticated', 'refined'], rationale: 'Style Elevation' },
    { keywords: ['texture', 'material', 'fabric', 'contrast', 'dimension'], rationale: 'Texture Balance' },
    { keywords: ['accessorize', 'complete', 'finishing touch', 'detail', 'accent'], rationale: 'Complete Look' },
    { keywords: ['structure', 'structured', 'tailored', 'fitted', 'sharp'], rationale: 'Structure Addition' },
    { keywords: ['layer', 'layering', 'depth', 'dimension', 'warmth'], rationale: 'Layer Addition' },
    { keywords: ['foundation', 'base', 'anchor', 'ground', 'establish'], rationale: 'Foundation Upgrade' },
    { keywords: ['versatile', 'adaptable', 'flexible', 'multi'], rationale: 'Versatility Boost' }
  ];

  // Check suggestion content for rationale
  for (const { keywords, rationale } of rationaleMap) {
    if (keywords.some(keyword => lowerSuggestion.includes(keyword))) {
      return rationale;
    }
  }
  
  // Item-based rationale as fallback
  const itemLower = item.toLowerCase();
  if (itemLower.includes('shoe') || itemLower.includes('sneaker') || itemLower.includes('boot')) {
    return 'Foundation Upgrade';
  }
  if (itemLower.includes('necklace') || itemLower.includes('bracelet') || itemLower.includes('earring') || itemLower.includes('watch') || itemLower.includes('belt')) {
    return 'Finishing Touch';
  }
  if (itemLower.includes('cardigan') || itemLower.includes('blazer') || itemLower.includes('jacket')) {
    return 'Layer Addition';
  }
  if (itemLower.includes('bag') || itemLower.includes('purse') || itemLower.includes('scarf')) {
    return 'Complete Look';
  }
  
  return 'Style Enhancement';
};
