import { Gender } from '@/context/RatingContext';

export interface FashionAttributes {
  gender: Gender;
  clothingType: string;
  fullPhrase: string; // New: capture the complete fashion phrase
  color?: string;
  material?: string;
  season?: string;
  occasion?: string;
  style?: string;
  fit?: string;
  pattern?: string;
}

export const extractFashionAttributes = (recommendation: string, gender: Gender): FashionAttributes => {
  console.log('Extracting fashion attributes from:', recommendation);
  
  const lowerRec = recommendation.toLowerCase();
  
  // Extract the full fashion phrase first - this is the key improvement
  const fullPhrase = extractFullFashionPhrase(recommendation);
  
  // Extract clothing type (most important)
  const clothingType = extractClothingType(lowerRec);
  
  // Extract other attributes
  const color = extractColor(lowerRec);
  const material = extractMaterial(lowerRec);
  const season = extractSeason(lowerRec);
  const occasion = extractOccasion(lowerRec);
  const style = extractStyle(lowerRec);
  const fit = extractFit(lowerRec);
  const pattern = extractPattern(lowerRec);
  
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
  
  console.log('Extracted attributes:', attributes);
  return attributes;
};

const extractFullFashionPhrase = (text: string): string => {
  console.log('Extracting full fashion phrase from:', text);
  
  // Pattern 1: Look for "add a/an [fashion item]" or "wear a/an [fashion item]"
  const addPattern = /(?:add|wear|try|consider)\s+(?:a|an|some)\s+([^.]+?)(?:\s+to|\s+for|\s+that|\s+which|\.|\s*$)/i;
  const addMatch = text.match(addPattern);
  if (addMatch && addMatch[1]) {
    const phrase = addMatch[1].trim();
    console.log('Found "add/wear" pattern:', phrase);
    return cleanFashionPhrase(phrase);
  }

  // Pattern 2: Look for compound fashion terms like "white linen shirt", "oversized sweater"
  const compoundPattern = /(?:^|\s)((?:(?:white|black|grey|gray|blue|navy|red|green|yellow|orange|purple|pink|brown|beige|cream|tan|burgundy|maroon|olive|khaki|light|dark|bright|pastel)\s+)?(?:cotton|linen|silk|wool|cashmere|denim|leather|suede|polyester|organic|sustainable)?\s*(?:oversized|fitted|slim|tailored|loose|relaxed|structured|flowy|form-fitting|cropped|long|short|midi|maxi|knee-length|ankle|high-waisted|low-rise)?\s*(?:shirt|blouse|top|tee|t-shirt|polo|tank|camisole|sweater|cardigan|hoodie|sweatshirt|jumper|jacket|blazer|coat|vest|waistcoat|dress|skirt|pants|trousers|jeans|shorts|leggings|chinos|shoes|sneakers|boots|heels|flats|sandals|pumps|loafers|oxfords|necklace|bracelet|watch|belt|bag|purse|scarf|hat|earrings|ring))/i;
  const compoundMatch = text.match(compoundPattern);
  if (compoundMatch && compoundMatch[1]) {
    const phrase = compoundMatch[1].trim();
    console.log('Found compound pattern:', phrase);
    return cleanFashionPhrase(phrase);
  }

  // Pattern 3: Look for seasonal + item combinations
  const seasonalPattern = /(?:summer|winter|spring|autumn|fall|warm|cold|breezy)\s+(?:weather\s+)?([^.]+?)(?:\s+to|\s+for|\s+that|\s+which|\.|\s*$)/i;
  const seasonalMatch = text.match(seasonalPattern);
  if (seasonalMatch && seasonalMatch[1]) {
    const phrase = seasonalMatch[1].trim();
    console.log('Found seasonal pattern:', phrase);
    return cleanFashionPhrase(phrase);
  }

  // Pattern 4: Look for style descriptors + items
  const stylePattern = /(?:elegant|chic|sophisticated|trendy|timeless|classic|modern|vintage|minimalist|professional|formal|casual|smart\s+casual)\s+([^.]+?)(?:\s+to|\s+for|\s+that|\s+which|\.|\s*$)/i;
  const styleMatch = text.match(stylePattern);
  if (styleMatch && styleMatch[1]) {
    const phrase = styleMatch[1].trim();
    console.log('Found style pattern:', phrase);
    return cleanFashionPhrase(phrase);
  }

  // Fallback: extract basic clothing type
  const clothingType = extractClothingType(text.toLowerCase());
  console.log('Using fallback clothing type:', clothingType);
  return clothingType;
};

const cleanFashionPhrase = (phrase: string): string => {
  // Remove common unnecessary words
  let cleaned = phrase
    .replace(/\b(to|for|that|which|would|could|might|will|can|should)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Ensure it doesn't end with connecting words
  cleaned = cleaned.replace(/\s+(to|for|that|which)$/i, '');
  
  console.log('Cleaned fashion phrase:', cleaned);
  return cleaned;
};

const extractClothingType = (text: string): string => {
  const clothingTypes = [
    'shirt', 'blouse', 'top', 'tee', 't-shirt', 'polo', 'tank', 'camisole',
    'sweater', 'cardigan', 'hoodie', 'sweatshirt', 'jumper',
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
  
  return searchTerms.join(' ');
};

export const createCleanProductName = (attributes: FashionAttributes): string => {
  // Use the full phrase if available, otherwise build from attributes
  if (attributes.fullPhrase && attributes.fullPhrase.trim()) {
    return attributes.fullPhrase
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
  
  return parts.join(' ');
};
