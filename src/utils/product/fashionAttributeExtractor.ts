
import { Gender } from '@/context/RatingContext';

export interface FashionAttributes {
  gender: Gender;
  clothingType: string;
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
  
  // Extract clothing type (most important)
  const clothingType = extractClothingType(lowerRec);
  
  // Extract color
  const color = extractColor(lowerRec);
  
  // Extract material
  const material = extractMaterial(lowerRec);
  
  // Extract season
  const season = extractSeason(lowerRec);
  
  // Extract occasion
  const occasion = extractOccasion(lowerRec);
  
  // Extract style descriptors
  const style = extractStyle(lowerRec);
  
  // Extract fit descriptors
  const fit = extractFit(lowerRec);
  
  // Extract pattern
  const pattern = extractPattern(lowerRec);
  
  const attributes: FashionAttributes = {
    gender,
    clothingType,
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
  
  // Always start with gender
  const genderPrefix = attributes.gender === 'male' ? 'mens' : 'womens';
  searchTerms.push(genderPrefix);
  
  // Add color if available
  if (attributes.color) {
    searchTerms.push(attributes.color);
  }
  
  // Add material if available
  if (attributes.material) {
    searchTerms.push(attributes.material);
  }
  
  // Add clothing type (most important)
  searchTerms.push(attributes.clothingType);
  
  // Add fit descriptor if available
  if (attributes.fit && !attributes.fit.includes('comfortable')) {
    searchTerms.push(attributes.fit);
  }
  
  // Add occasion if professional/formal
  if (attributes.occasion && (attributes.occasion.includes('professional') || attributes.occasion.includes('formal'))) {
    searchTerms.push(attributes.occasion);
  }
  
  // Add season for summer items
  if (attributes.season === 'summer') {
    searchTerms.push('summer');
  }
  
  return searchTerms.join(' ');
};

export const createCleanProductName = (attributes: FashionAttributes): string => {
  const parts: string[] = [];
  
  // Add color
  if (attributes.color) {
    parts.push(attributes.color.charAt(0).toUpperCase() + attributes.color.slice(1));
  }
  
  // Add material
  if (attributes.material) {
    parts.push(attributes.material.charAt(0).toUpperCase() + attributes.material.slice(1));
  }
  
  // Add clothing type
  const clothingType = attributes.clothingType.charAt(0).toUpperCase() + attributes.clothingType.slice(1);
  parts.push(clothingType);
  
  return parts.join(' ');
};
