
import { Gender } from '@/context/RatingContext';

// Enhanced product name mappings with more specific items
export const SPECIFIC_PRODUCT_NAMES: Record<string, { female: string; male: string }> = {
  // Footwear
  'white sneakers': { female: 'White Leather Sneakers', male: 'White Leather Sneakers' },
  'sneakers': { female: 'Clean White Sneakers', male: 'Minimalist White Sneakers' },
  'block heels': { female: 'Block Heel Pumps', male: 'Dress Shoes' },
  'heels': { female: 'Classic Block Heels', male: 'Oxford Shoes' },
  'ankle boots': { female: 'Sleek Ankle Boots', male: 'Chelsea Boots' },
  'boots': { female: 'Versatile Ankle Boots', male: 'Classic Chelsea Boots' },
  'dress shoes': { female: 'Pointed Toe Flats', male: 'Oxford Dress Shoes' },
  'ballet flats': { female: 'Classic Ballet Flats', male: 'Casual Loafers' },
  'flats': { female: 'Comfortable Ballet Flats', male: 'Leather Loafers' },
  'sandals': { female: 'Strappy Block Sandals', male: 'Leather Sandals' },
  'strappy sandals': { female: 'Elegant Strappy Sandals', male: 'Brown Leather Sandals' },
  
  // Accessories
  'statement necklace': { female: 'Delicate Statement Necklace', male: 'Silver Chain Necklace' },
  'necklace': { female: 'Gold Layered Necklace', male: 'Simple Chain Necklace' },
  'watch': { female: 'Rose Gold Watch', male: 'Leather Strap Watch' },
  'leather watch': { female: 'Minimalist Leather Watch', male: 'Classic Leather Watch' },
  'bag': { female: 'Structured Crossbody Bag', male: 'Canvas Messenger Bag' },
  'crossbody bag': { female: 'Leather Crossbody Bag', male: 'Casual Messenger Bag' },
  'belt': { female: 'Thin Leather Belt', male: 'Brown Leather Belt' },
  'leather belt': { female: 'Classic Leather Belt', male: 'Genuine Leather Belt' },
  'earrings': { female: 'Gold Stud Earrings', male: 'Silver Cufflinks' },
  'stud earrings': { female: 'Classic Gold Studs', male: 'Elegant Cufflinks' },
  'scarf': { female: 'Silk Square Scarf', male: 'Wool Pocket Square' },
  'silk scarf': { female: 'Luxury Silk Scarf', male: 'Classic Pocket Square' },
  
  // Outerwear & Layers
  'cardigan': { female: 'Soft Knit Cardigan', male: 'V-Neck Cardigan' },
  'white cardigan': { female: 'Crisp White Cardigan', male: 'Clean White Cardigan' },
  'knit cardigan': { female: 'Cozy Knit Cardigan', male: 'Wool Blend Cardigan' },
  'blazer': { female: 'Tailored Blazer', male: 'Navy Blazer' },
  'structured blazer': { female: 'Sharp Tailored Blazer', male: 'Classic Navy Blazer' },
  'jacket': { female: 'Cropped Denim Jacket', male: 'Casual Denim Jacket' },
  'denim jacket': { female: 'Vintage Denim Jacket', male: 'Classic Denim Jacket' },
  
  // Tops
  'shirt': { female: 'Crisp Button-Down Shirt', male: 'White Dress Shirt' },
  'button down shirt': { female: 'Classic White Blouse', male: 'Crisp White Shirt' },
  'blouse': { female: 'Elegant Silk Blouse', male: 'Cotton Dress Shirt' },
  'top': { female: 'Fitted Blouse', male: 'Casual Polo Shirt' },
  'fitted top': { female: 'Stretch Fitted Top', male: 'Slim Fit T-Shirt' },
  'sweater': { female: 'Cashmere Pullover', male: 'Wool Crew Sweater' },
  'patterned shirt': { female: 'Printed Silk Blouse', male: 'Patterned Dress Shirt' },
  'black patterned shirt': { female: 'Black Print Blouse', male: 'Black Patterned Shirt' },
  
  // Bottoms
  'jeans': { female: 'High-Waisted Dark Jeans', male: 'Straight Leg Jeans' },
  'high waisted jeans': { female: 'High-Rise Skinny Jeans', male: 'Classic Straight Jeans' },
  'dark jeans': { female: 'Dark Wash Skinny Jeans', male: 'Dark Indigo Jeans' },
  'pants': { female: 'High-Waisted Trousers', male: 'Tailored Chinos' },
  'tailored pants': { female: 'Slim Tailored Trousers', male: 'Pressed Dress Pants' },
  'chinos': { female: 'High-Waisted Chinos', male: 'Classic Khaki Chinos' },
  'skirt': { female: 'A-Line Midi Skirt', male: 'Casual Shorts' },
  'midi skirt': { female: 'Elegant Midi Skirt', male: 'Tailored Shorts' },
  
  // Dresses
  'dress': { female: 'A-Line Midi Dress', male: 'Polo Shirt' },
  'midi dress': { female: 'Elegant Midi Dress', male: 'Button-Down Shirt' },
  
  // Socks & Hosiery
  'socks': { female: 'Crew Socks', male: 'Dress Socks' },
  'knee-high socks': { female: 'Knee-High Socks', male: 'Wool Dress Socks' },
};

export const getSpecificProductName = (searchTerm: string, gender: Gender): string => {
  const cleanedTerm = searchTerm.toLowerCase()
    .replace(/\b(?:mens|womens|men's|women's)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log('Getting specific name for:', cleanedTerm, 'Gender:', gender);
  
  // Check for exact matches first
  if (SPECIFIC_PRODUCT_NAMES[cleanedTerm]) {
    const result = SPECIFIC_PRODUCT_NAMES[cleanedTerm][gender];
    console.log('Exact match found:', result);
    return result;
  }
  
  // Check for partial matches (more flexible)
  for (const [key, value] of Object.entries(SPECIFIC_PRODUCT_NAMES)) {
    // Check if the cleaned term contains the key or vice versa
    if (cleanedTerm.includes(key) || key.includes(cleanedTerm)) {
      const result = value[gender];
      console.log('Partial match found:', key, '->', result);
      return result;
    }
    
    // Check word-by-word matching for compound terms
    const keyWords = key.split(' ');
    const termWords = cleanedTerm.split(' ');
    
    const hasCommonWords = keyWords.some(keyWord => 
      termWords.some(termWord => 
        keyWord.includes(termWord) || termWord.includes(keyWord)
      )
    );
    
    if (hasCommonWords && keyWords.length <= termWords.length + 1) {
      const result = value[gender];
      console.log('Word-based match found:', key, '->', result);
      return result;
    }
  }
  
  // Enhanced fallback: format the original term nicely
  const fallbackName = searchTerm
    .replace(/\b(?:mens|womens|men's|women's)\b/g, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
  
  console.log('Using fallback name:', fallbackName);
  return fallbackName;
};
