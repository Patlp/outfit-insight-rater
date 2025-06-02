import { Gender } from '@/context/RatingContext';

export interface FashionAttributes {
  gender: Gender;
  clothingType: string;
  fullPhrase: string; // Complete fashion phrase for UI and search
  color?: string;
  material?: string;
  season?: string;
  occasion?: string;
  style?: string;
  fit?: string;
  pattern?: string;
}

export const extractFashionAttributes = (recommendation: string, gender: Gender): FashionAttributes => {
  console.log('=== EXTRACTING FASHION ATTRIBUTES ===');
  console.log('Input:', recommendation);
  console.log('Gender:', gender);
  
  // Extract the full fashion phrase using improved chunking logic
  const fullPhrase = extractFullFashionPhraseWithChunking(recommendation);
  console.log('Extracted full phrase:', fullPhrase);
  
  // Extract clothing type from the full phrase
  const clothingType = extractClothingType(fullPhrase.toLowerCase());
  
  // Extract other attributes
  const color = extractColor(fullPhrase.toLowerCase());
  const material = extractMaterial(fullPhrase.toLowerCase());
  const season = extractSeason(recommendation.toLowerCase());
  const occasion = extractOccasion(recommendation.toLowerCase());
  const style = extractStyle(fullPhrase.toLowerCase());
  const fit = extractFit(fullPhrase.toLowerCase());
  const pattern = extractPattern(fullPhrase.toLowerCase());
  
  const attributes: FashionAttributes = {
    gender,
    clothingType,
    fullPhrase,
    color,
    material,
    season,
    occasion,
    style,
    fit,
    pattern
  };
  
  console.log('Final attributes:', attributes);
  return attributes;
};

const extractFullFashionPhraseWithChunking = (text: string): string => {
  console.log('Extracting fashion phrase with chunking from:', text);
  
  // Primary chunking pattern as specified - captures compound fashion phrases
  const chunkingPattern = /(?:add|try|wear|swap|consider|incorporate)\s+(?:a|an|some)?\s*((?:\w+-?\w*\s*){0,3}?(?:sweater|shirt|coat|jeans|blazer|cardigan|pants|scarf|hat|gloves|sneakers|shoes|skirt|dress|boots|shorts|jacket|trousers|turtleneck|tank|suit|tracksuit|tights|tunic|top|blouse|polo|hoodie|vest|leggings|chinos|sandals|flats|heels|pumps|loafers|oxfords|belt|bag|purse|necklace|bracelet|watch|earrings|ring))\b/gi;
  
  const chunkMatches = [];
  let match;
  
  while ((match = chunkingPattern.exec(text)) !== null) {
    const extracted = match[1].trim();
    if (extracted) {
      chunkMatches.push(extracted);
      console.log('Found chunked phrase:', extracted);
    }
  }
  
  // Select the best chunked match if available
  if (chunkMatches.length > 0) {
    const bestChunkMatch = selectMostSpecificMatch(chunkMatches);
    console.log('Selected best chunk match:', bestChunkMatch);
    return cleanPhrase(bestChunkMatch);
  }
  
  // Fallback to previous extraction methods
  console.log('No chunked matches found, falling back to previous methods');
  return extractFullFashionPhrase(text);
};

const selectMostSpecificMatch = (matches: string[]): string => {
  // Sort by specificity - more words and descriptors = more specific
  return matches
    .sort((a, b) => {
      const aWords = a.split(/\s+/).length;
      const bWords = b.split(/\s+/).length;
      
      // Prefer longer phrases
      if (aWords !== bWords) {
        return bWords - aWords;
      }
      
      // Prefer phrases with material/color descriptors
      const aHasDescriptors = hasQualityDescriptors(a);
      const bHasDescriptors = hasQualityDescriptors(b);
      
      if (aHasDescriptors && !bHasDescriptors) return -1;
      if (!aHasDescriptors && bHasDescriptors) return 1;
      
      return 0;
    })[0];
};

const hasQualityDescriptors = (phrase: string): boolean => {
  const descriptors = [
    'white', 'black', 'blue', 'navy', 'red', 'green', 'grey', 'gray', 'beige', 'cream',
    'cotton', 'linen', 'silk', 'wool', 'cashmere', 'denim', 'leather',
    'oversized', 'fitted', 'slim', 'loose', 'structured', 'lightweight', 'heavy'
  ];
  
  return descriptors.some(descriptor => phrase.toLowerCase().includes(descriptor));
};

const extractFullFashionPhrase = (text: string): string => {
  console.log('Extracting full fashion phrase from:', text);
  
  // Step 1: Look for direct fashion item mentions with descriptors
  const directMatches = findDirectFashionItems(text);
  if (directMatches.length > 0) {
    const bestMatch = selectBestMatch(directMatches);
    console.log('Found direct match:', bestMatch);
    return cleanPhrase(bestMatch);
  }
  
  // Step 2: Look for action-based suggestions (add/wear/try X)
  const actionMatches = findActionBasedItems(text);
  if (actionMatches.length > 0) {
    const bestMatch = selectBestMatch(actionMatches);
    console.log('Found action-based match:', bestMatch);
    return cleanPhrase(bestMatch);
  }
  
  // Step 3: Look for compound descriptive phrases
  const compoundMatches = findCompoundPhrases(text);
  if (compoundMatches.length > 0) {
    const bestMatch = selectBestMatch(compoundMatches);
    console.log('Found compound match:', bestMatch);
    return cleanPhrase(bestMatch);
  }
  
  // Step 4: Extract basic clothing item as fallback
  const clothingType = extractClothingType(text.toLowerCase());
  console.log('Using fallback clothing type:', clothingType);
  return clothingType;
};

const findDirectFashionItems = (text: string): string[] => {
  // Enhanced pattern for capturing complete fashion phrases
  const pattern = /\b(?:(?:lightweight|heavy|thick|thin|oversized|fitted|slim|loose|relaxed|structured|soft|comfortable|breathable|warm|cool|casual|formal|elegant|classic|modern|vintage|trendy|stylish|chic|sophisticated|professional|smart|dressy|sporty|athletic|business|work|office|date|party|evening|wedding|cocktail|beach|vacation|summer|winter|spring|fall|autumn|breezy|cozy|statement|basic|essential|minimalist|bold|subtle|neutral|colorful|bright|dark|light|pastel|vibrant|muted|solid|plain|patterned|striped|floral|checkered|plaid|printed|textured|ribbed|quilted|embroidered|mesh|sheer|stretchy|high-quality|luxury|premium|designer|tailored)\s+)*(?:(?:white|black|grey|gray|blue|navy|red|green|yellow|orange|purple|pink|brown|beige|cream|tan|burgundy|maroon|olive|khaki|denim|light|dark|bright|pastel|deep|rich|soft|bold|neutral|metallic|faded|vintage|washed)\s+)*(?:(?:cotton|linen|silk|wool|cashmere|denim|leather|suede|polyester|organic|sustainable|jersey|knit|woven|canvas|fleece|velvet|satin|mesh|lycra)\s+)*(?:(?:long|short|midi|maxi|knee-length|ankle|cropped|full-length|three-quarter|sleeveless|short-sleeve|long-sleeve|tank|strapless|halter|off-shoulder|wrap|button-up|button-down|pullover|zip-up|hoodie|crew-neck|v-neck|scoop-neck|turtleneck|collar|collarless|pockets|belted|pleated|straight|flared|bootcut|skinny|wide-leg|high-waisted|mid-rise|low-rise)\s+)*(?:shirt|blouse|top|tee|t-shirt|polo|tank|camisole|sweater|cardigan|hoodie|sweatshirt|jumper|pullover|jacket|blazer|coat|vest|dress|skirt|pants|trousers|jeans|shorts|leggings|chinos|joggers|suit|shoes|sneakers|boots|heels|flats|sandals|pumps|loafers|oxfords|necklace|bracelet|watch|belt|bag|purse|scarf|hat|cap|earrings|ring)\b/gi;
  
  const matches = text.match(pattern) || [];
  return matches
    .map(match => match.trim())
    .filter(match => match.length > 2 && containsClothingItem(match));
};

const findActionBasedItems = (text: string): string[] => {
  const actionPattern = /(?:add|wear|try|consider|choose|opt for|go with|pick|select)\s+(?:a|an|some)?\s*([^.!?]+?)(?:\s+(?:to|for|that|which|would|could|might|will)|\.|!|\?|$)/gi;
  const matches = [];
  let match;
  
  while ((match = actionPattern.exec(text)) !== null) {
    const extracted = match[1].trim();
    if (containsClothingItem(extracted)) {
      matches.push(extracted);
    }
  }
  
  return matches;
};

const findCompoundPhrases = (text: string): string[] => {
  // Look for descriptive + color + material + item combinations
  const compoundPattern = /\b(?:(?:light|heavy|soft|comfortable|stylish|elegant|classic|modern|trendy|casual|formal|professional|structured|relaxed|fitted|loose|oversized|slim)\s+)?(?:(?:white|black|grey|gray|blue|navy|red|green|yellow|orange|purple|pink|brown|beige|cream|neutral|bright|dark|light|pastel)\s+)?(?:(?:cotton|linen|silk|wool|cashmere|leather|denim|organic)\s+)?(?:shirt|blouse|top|sweater|cardigan|jacket|blazer|dress|pants|jeans|shoes|sneakers|boots)\b/gi;
  
  const matches = text.match(compoundPattern) || [];
  return matches
    .map(match => match.trim())
    .filter(match => match.split(' ').length > 1); // Only compound phrases
};

const selectBestMatch = (matches: string[]): string => {
  // Sort by specificity (more words = more specific)
  return matches
    .sort((a, b) => {
      const aWords = a.split(' ').length;
      const bWords = b.split(' ').length;
      return bWords - aWords; // Descending order
    })[0];
};

const cleanPhrase = (phrase: string): string => {
  // Remove connecting words and articles while preserving fashion descriptors
  let cleaned = phrase
    .replace(/\b(to|for|that|which|would|could|might|will|can|should|and|or|but|also|too|very|really|quite|rather|somewhat|fairly|pretty|super|extra|ultra|more|most|less|least|much|many|few|little|big|small|large|tiny|huge|enormous|massive|giant|mini|micro|macro)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove trailing connecting words
  cleaned = cleaned.replace(/\s+(to|for|that|which)$/i, '');
  
  // Remove leading articles if they don't add value
  cleaned = cleaned.replace(/^(a|an|the)\s+/i, '');
  
  console.log('Cleaned phrase:', cleaned);
  return cleaned || phrase; // Fallback to original if cleaning removes everything
};

const containsClothingItem = (phrase: string): boolean => {
  const clothingItems = [
    'shirt', 'blouse', 'top', 'tee', 't-shirt', 'polo', 'tank', 'camisole',
    'sweater', 'cardigan', 'hoodie', 'sweatshirt', 'jumper', 'pullover',
    'jacket', 'blazer', 'coat', 'vest', 'waistcoat',
    'dress', 'skirt', 'pants', 'trousers', 'jeans', 'shorts', 'leggings', 'chinos',
    'shoes', 'sneakers', 'boots', 'heels', 'flats', 'sandals', 'pumps', 'loafers',
    'necklace', 'bracelet', 'watch', 'belt', 'bag', 'purse', 'scarf', 'hat'
  ];
  
  return clothingItems.some(item => phrase.toLowerCase().includes(item));
};

const extractClothingType = (text: string): string => {
  const clothingTypes = [
    'shirt', 'blouse', 'top', 'tee', 't-shirt', 'polo', 'tank', 'camisole',
    'sweater', 'cardigan', 'hoodie', 'sweatshirt', 'jumper', 'pullover',
    'jacket', 'blazer', 'coat', 'vest', 'waistcoat',
    'dress', 'skirt', 'pants', 'trousers', 'jeans', 'shorts', 'leggings', 'chinos',
    'shoes', 'sneakers', 'boots', 'heels', 'flats', 'sandals', 'pumps', 'loafers', 'oxfords',
    'necklace', 'bracelet', 'watch', 'belt', 'bag', 'purse', 'scarf', 'hat', 'earrings', 'ring'
  ];
  
  for (const type of clothingTypes) {
    if (text.includes(type)) {
      return type;
    }
  }
  
  return 'shirt'; // fallback
};

const extractColor = (text: string): string | undefined => {
  const colors = [
    'white', 'black', 'grey', 'gray', 'blue', 'navy', 'red', 'green', 'yellow', 
    'orange', 'purple', 'pink', 'brown', 'beige', 'cream', 'tan', 'burgundy',
    'maroon', 'olive', 'khaki', 'denim', 'light', 'dark', 'bright', 'pastel'
  ];
  
  for (const color of colors) {
    if (text.includes(color)) {
      return color;
    }
  }
  
  return undefined;
};

const extractMaterial = (text: string): string | undefined => {
  const materials = [
    'cotton', 'linen', 'silk', 'wool', 'cashmere', 'denim', 'leather', 'suede',
    'polyester', 'nylon', 'spandex', 'elastane', 'viscose', 'rayon', 'bamboo',
    'organic', 'sustainable', 'recycled'
  ];
  
  for (const material of materials) {
    if (text.includes(material)) {
      return material;
    }
  }
  
  return undefined;
};

const extractSeason = (text: string): string | undefined => {
  const seasons = ['summer', 'winter', 'spring', 'autumn', 'fall'];
  
  for (const season of seasons) {
    if (text.includes(season)) {
      return season;
    }
  }
  
  // Seasonal descriptors
  if (text.includes('warm') || text.includes('hot') || text.includes('breezy')) return 'summer';
  if (text.includes('cold') || text.includes('cozy') || text.includes('warm layer')) return 'winter';
  
  return undefined;
};

const extractOccasion = (text: string): string | undefined => {
  const occasions = [
    'work', 'office', 'business', 'professional', 'formal', 'casual', 'smart casual',
    'date', 'party', 'evening', 'wedding', 'cocktail', 'beach', 'vacation',
    'athletic', 'gym', 'workout', 'sporty', 'everyday', 'weekend'
  ];
  
  for (const occasion of occasions) {
    if (text.includes(occasion)) {
      return occasion;
    }
  }
  
  return undefined;
};

const extractStyle = (text: string): string | undefined => {
  const styles = [
    'classic', 'modern', 'vintage', 'retro', 'minimalist', 'bohemian', 'boho',
    'preppy', 'edgy', 'elegant', 'chic', 'sophisticated', 'trendy', 'timeless'
  ];
  
  for (const style of styles) {
    if (text.includes(style)) {
      return style;
    }
  }
  
  return undefined;
};

const extractFit = (text: string): string | undefined => {
  const fits = [
    'fitted', 'slim', 'tailored', 'loose', 'oversized', 'relaxed', 'comfortable',
    'stretchy', 'structured', 'flowy', 'form-fitting', 'regular fit'
  ];
  
  for (const fit of fits) {
    if (text.includes(fit)) {
      return fit;
    }
  }
  
  return undefined;
};

const extractPattern = (text: string): string | undefined => {
  const patterns = [
    'striped', 'polka dot', 'floral', 'plaid', 'checkered', 'solid', 'plain',
    'printed', 'embroidered', 'textured', 'ribbed', 'quilted'
  ];
  
  for (const pattern of patterns) {
    if (text.includes(pattern)) {
      return pattern;
    }
  }
  
  return undefined;
};

export const buildAmazonSearchQuery = (attributes: FashionAttributes): string => {
  console.log('=== BUILDING AMAZON SEARCH QUERY ===');
  console.log('Input attributes:', attributes);
  
  const searchTerms: string[] = [];
  
  // Always start with gender prefix
  const genderPrefix = attributes.gender === 'male' ? 'mens' : 'womens';
  searchTerms.push(genderPrefix);
  
  // Use the full phrase as the primary search term
  if (attributes.fullPhrase && attributes.fullPhrase.trim()) {
    // Clean and add the full phrase
    const cleanPhrase = attributes.fullPhrase
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    searchTerms.push(cleanPhrase);
  } else {
    // Fallback to building from individual attributes
    if (attributes.color) {
      searchTerms.push(attributes.color);
    }
    
    if (attributes.material) {
      searchTerms.push(attributes.material);
    }
    
    searchTerms.push(attributes.clothingType);
    
    if (attributes.fit && !attributes.fit.includes('comfortable')) {
      searchTerms.push(attributes.fit);
    }
  }
  
  const finalQuery = searchTerms.join(' ');
  console.log('Generated search query:', finalQuery);
  return finalQuery;
};

export const createCleanProductName = (attributes: FashionAttributes): string => {
  console.log('=== CREATING CLEAN PRODUCT NAME ===');
  console.log('Input attributes:', attributes);
  
  // Use the full phrase if available, otherwise build from attributes
  if (attributes.fullPhrase && attributes.fullPhrase.trim()) {
    const cleanName = attributes.fullPhrase
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    console.log('Generated product name from phrase:', cleanName);
    return cleanName;
  }
  
  // Fallback to the original method
  const parts: string[] = [];
  
  if (attributes.color) {
    parts.push(attributes.color.charAt(0).toUpperCase() + attributes.color.slice(1));
  }
  
  if (attributes.material) {
    parts.push(attributes.material.charAt(0).toUpperCase() + attributes.material.slice(1));
  }
  
  const clothingType = attributes.clothingType.charAt(0).toUpperCase() + attributes.clothingType.slice(1);
  parts.push(clothingType);
  
  const fallbackName = parts.join(' ');
  console.log('Generated fallback product name:', fallbackName);
  return fallbackName;
};
