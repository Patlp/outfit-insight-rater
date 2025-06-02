
import { Gender } from '@/context/RatingContext';

// Specific product name mappings with gender variants
export const SPECIFIC_PRODUCT_NAMES: Record<string, { female: string; male: string }> = {
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

export const getSpecificProductName = (searchTerm: string, gender: Gender): string => {
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
};
