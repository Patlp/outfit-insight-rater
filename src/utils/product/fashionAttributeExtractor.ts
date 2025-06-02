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
  console.log('Extracting fashion attributes from:', recommendation);
  
  const lowerRec = recommendation.toLowerCase();
  
  // Extract the full fashion phrase - this is the key improvement
  const fullPhrase = extractFullFashionPhrase(recommendation);
  console.log('Extracted full phrase:', fullPhrase);
  
  // Extract clothing type from the full phrase
  const clothingType = extractClothingType(fullPhrase.toLowerCase());
  
  // Extract other attributes from the full phrase
  const color = extractColor(fullPhrase.toLowerCase());
  const material = extractMaterial(fullPhrase.toLowerCase());
  const season = extractSeason(lowerRec);
  const occasion = extractOccasion(lowerRec);
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
  
  console.log('Final extracted attributes:', attributes);
  return attributes;
};

const extractFullFashionPhrase = (text: string): string => {
  console.log('Extracting full fashion phrase from:', text);
  
  // Pattern 1: Direct fashion items with descriptors
  // Matches: "lightweight cardigan", "white linen shirt", "structured navy blazer"
  const directItemPattern = /(?:^|\s|,\s*)((?:(?:lightweight|heavy|thick|thin|oversized|fitted|slim|loose|relaxed|structured|soft|comfortable|breathable|warm|cool|casual|formal|elegant|classic|modern|vintage|trendy|stylish|chic|sophisticated|professional|smart|dressy|sporty|athletic|activewear|business|work|office|date|party|evening|wedding|cocktail|beach|vacation|summer|winter|spring|fall|autumn|seasonal|weather|breezy|cozy|layering|statement|basic|essential|minimalist|bold|subtle|neutral|colorful|bright|dark|light|pastel|vibrant|muted|solid|plain|patterned|striped|floral|polka|dot|checkered|plaid|printed|textured|ribbed|quilted|embroidered|lace|mesh|sheer|opaque|stretchy|non-stretch|wrinkle-free|easy-care|sustainable|organic|eco-friendly|recycled|high-quality|luxury|premium|affordable|budget|designer|brand|custom|tailored|ready-to-wear|off-the-rack)\s+)*(?:(?:white|black|grey|gray|blue|navy|red|green|yellow|orange|purple|pink|brown|beige|cream|tan|burgundy|maroon|olive|khaki|denim|light|dark|bright|pastel|deep|rich|soft|bold|neutral|colorful|vibrant|muted|metallic|shiny|matte|glossy|faded|distressed|vintage|washed)\s+)*(?:(?:cotton|linen|silk|wool|cashmere|denim|leather|suede|polyester|nylon|spandex|elastane|viscose|rayon|bamboo|organic|sustainable|recycled|synthetic|natural|blended|jersey|knit|woven|twill|canvas|corduroy|fleece|terry|velvet|satin|chiffon|tulle|mesh|lace|lycra|modal|tencel|hemp|alpaca)\s+)*(?:(?:long|short|midi|maxi|knee-length|ankle|cropped|full-length|three-quarter|quarter|half|cap|sleeveless|short-sleeve|long-sleeve|tank|tube|strapless|halter|off-shoulder|one-shoulder|wrap|button-up|button-down|pullover|zip-up|hoodie|crew-neck|v-neck|scoop-neck|boat-neck|turtleneck|mock-neck|collar|collarless|lapel|no-lapel|pockets|no-pockets|belted|unbelted|pleated|unpleated|gathered|straight|flared|bootcut|skinny|wide-leg|tapered|high-waisted|mid-rise|low-rise|regular-rise)\s+)*(?:shirt|blouse|top|tee|t-shirt|polo|tank|camisole|sweater|cardigan|hoodie|sweatshirt|jumper|pullover|jacket|blazer|coat|vest|waistcoat|dress|skirt|pants|trousers|jeans|shorts|leggings|chinos|joggers|tracksuit|suit|romper|jumpsuit|overalls|dungarees|shoes|sneakers|boots|heels|flats|sandals|pumps|loafers|oxfords|moccasins|clogs|slippers|trainers|runners|athletic|footwear|necklace|bracelet|watch|belt|bag|purse|handbag|tote|clutch|backpack|scarf|hat|cap|beanie|headband|sunglasses|glasses|earrings|ring|brooch|pin|tie|bowtie|suspenders|cufflinks|gloves|mittens|socks|stockings|tights|underwear|bra|panties|boxers|briefs|lingerie|sleepwear|pajamas|nightgown|robe|swimwear|bikini|swimsuit|activewear|sportswear|athleisure))(?:\s|$|,|\.|\!|\?))/gi;
  
  const directMatches = text.match(directItemPattern);
  if (directMatches && directMatches.length > 0) {
    // Get the longest, most specific match
    const bestMatch = directMatches
      .map(match => match.trim().replace(/^[,\s]+|[,\s.!?]+$/g, ''))
      .filter(match => match.length > 0)
      .sort((a, b) => b.length - a.length)[0];
    
    if (bestMatch && bestMatch.length > 3) {
      console.log('Found direct item pattern:', bestMatch);
      return cleanFashionPhrase(bestMatch);
    }
  }
  
  // Pattern 2: "add/wear/try/consider [fashion phrase]" constructions
  const actionPattern = /(?:add|wear|try|consider|choose|opt for|go with|pick|select)\s+(?:a|an|some)?\s*([^.!?]+?)(?:\s+(?:to|for|that|which|would|could|might|will)|\.|!|\?|$)/gi;
  const actionMatches = text.match(actionPattern);
  if (actionMatches && actionMatches.length > 0) {
    for (const match of actionMatches) {
      const extractedPhrase = match.replace(/(?:add|wear|try|consider|choose|opt for|go with|pick|select)\s+(?:a|an|some)?\s*/gi, '').trim();
      const cleanedPhrase = extractedPhrase.replace(/\s+(?:to|for|that|which|would|could|might|will).*$/gi, '').trim();
      
      if (cleanedPhrase && containsClothingItem(cleanedPhrase)) {
        console.log('Found action pattern:', cleanedPhrase);
        return cleanFashionPhrase(cleanedPhrase);
      }
    }
  }
  
  // Pattern 3: Compound descriptive phrases
  const compoundPattern = /(?:^|\s|,\s*)((?:(?:light|heavy|soft|comfortable|breathable|stylish|elegant|classic|modern|trendy|casual|formal|professional|smart|structured|relaxed|fitted|loose|oversized|slim)\s+)?(?:(?:white|black|grey|gray|blue|navy|red|green|yellow|orange|purple|pink|brown|beige|cream|tan|burgundy|maroon|olive|khaki|denim|neutral|colorful|bright|dark|light|pastel)\s+)?(?:(?:cotton|linen|silk|wool|cashmere|leather|denim|polyester|organic|sustainable)\s+)?(?:shirt|blouse|top|sweater|cardigan|jacket|blazer|dress|pants|jeans|shoes|sneakers|boots))(?:\s|$|,|\.)/gi;
  
  const compoundMatches = text.match(compoundPattern);
  if (compoundMatches && compoundMatches.length > 0) {
    const bestCompound = compoundMatches
      .map(match => match.trim().replace(/^[,\s]+|[,\s.]+$/g, ''))
      .filter(match => match.length > 0)
      .sort((a, b) => b.split(' ').length - a.split(' ').length)[0];
    
    if (bestCompound && bestCompound.split(' ').length > 1) {
      console.log('Found compound pattern:', bestCompound);
      return cleanFashionPhrase(bestCompound);
    }
  }
  
  // Pattern 4: Seasonal + item combinations
  const seasonalPattern = /(?:summer|winter|spring|autumn|fall|warm|cold|breezy|lightweight|heavy)\s+(?:weather\s+)?([^.!?]+?)(?:\s+(?:to|for|that|which)|\.|!|\?|$)/gi;
  const seasonalMatches = text.match(seasonalPattern);
  if (seasonalMatches && seasonalMatches.length > 0) {
    for (const match of seasonalMatches) {
      const cleanedMatch = match.replace(/\s+(?:to|for|that|which).*$/gi, '').trim();
      if (containsClothingItem(cleanedMatch)) {
        console.log('Found seasonal pattern:', cleanedMatch);
        return cleanFashionPhrase(cleanedMatch);
      }
    }
  }
  
  // Fallback: extract basic clothing type
  const clothingType = extractClothingType(text.toLowerCase());
  console.log('Using fallback clothing type:', clothingType);
  return clothingType;
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

const cleanFashionPhrase = (phrase: string): string => {
  // Remove common unnecessary words while preserving fashion descriptors
  let cleaned = phrase
    .replace(/\b(to|for|that|which|would|could|might|will|can|should|and|or|but|also|too|very|really|quite|rather|somewhat|fairly|pretty|super|extra|ultra|more|most|less|least|much|many|few|little|big|small|large|tiny|huge|enormous|massive|giant|mini|micro|macro)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove trailing connecting words
  cleaned = cleaned.replace(/\s+(to|for|that|which)$/i, '');
  
  // Remove leading articles if they don't add value
  cleaned = cleaned.replace(/^(a|an|the)\s+/i, '');
  
  console.log('Cleaned fashion phrase:', cleaned);
  return cleaned;
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
