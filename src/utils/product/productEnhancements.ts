
// Common fashion terms and their enhanced versions
export const PRODUCT_ENHANCEMENTS: Record<string, { enhanced: string; category: string }> = {
  // Footwear
  'shoes': { enhanced: 'dress shoes', category: 'footwear' },
  'sneakers': { enhanced: 'white sneakers', category: 'footwear' },
  'boots': { enhanced: 'ankle boots', category: 'footwear' },
  'heels': { enhanced: 'block heels', category: 'footwear' },
  'flats': { enhanced: 'ballet flats', category: 'footwear' },
  'sandals': { enhanced: 'strappy sandals', category: 'footwear' },
  
  // Accessories
  'necklace': { enhanced: 'statement necklace', category: 'accessories' },
  'bracelet': { enhanced: 'gold bracelet', category: 'accessories' },
  'watch': { enhanced: 'leather watch', category: 'accessories' },
  'belt': { enhanced: 'leather belt', category: 'accessories' },
  'bag': { enhanced: 'crossbody bag', category: 'accessories' },
  'purse': { enhanced: 'structured handbag', category: 'accessories' },
  'earrings': { enhanced: 'stud earrings', category: 'accessories' },
  'scarf': { enhanced: 'silk scarf', category: 'accessories' },
  'hat': { enhanced: 'wide brim hat', category: 'accessories' },
  
  // Clothing
  'jacket': { enhanced: 'blazer jacket', category: 'outerwear' },
  'blazer': { enhanced: 'structured blazer', category: 'outerwear' },
  'cardigan': { enhanced: 'knit cardigan', category: 'outerwear' },
  'shirt': { enhanced: 'button down shirt', category: 'tops' },
  'blouse': { enhanced: 'silk blouse', category: 'tops' },
  'top': { enhanced: 'fitted top', category: 'tops' },
  'dress': { enhanced: 'midi dress', category: 'dresses' },
  'pants': { enhanced: 'tailored pants', category: 'bottoms' },
  'jeans': { enhanced: 'high waisted jeans', category: 'bottoms' },
  'skirt': { enhanced: 'midi skirt', category: 'bottoms' },
  'shorts': { enhanced: 'tailored shorts', category: 'bottoms' },
};

export const enhanceProductName = (productName: string): string => {
  const words = productName.toLowerCase().split(' ');
  
  // Check if any word matches our enhancement dictionary
  for (const word of words) {
    if (PRODUCT_ENHANCEMENTS[word]) {
      return PRODUCT_ENHANCEMENTS[word].enhanced;
    }
  }
  
  // If no exact match, return the original with some common enhancements
  if (words.includes('shirt')) return 'button down shirt';
  if (words.includes('pants')) return 'tailored pants';
  if (words.includes('dress')) return 'midi dress';
  
  return productName;
};
