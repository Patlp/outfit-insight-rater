
import { Gender } from '@/context/RatingContext';

// Enhanced product name mappings with better organization
export const SPECIFIC_PRODUCT_NAMES: Record<string, { female: string; male: string }> = {
  // Footwear
  'white sneakers': { female: 'White Leather Sneakers', male: 'White Leather Sneakers' },
  'sneakers': { female: 'Clean White Sneakers', male: 'Minimalist White Sneakers' },
  'clean sneakers': { female: 'Clean White Sneakers', male: 'Clean White Sneakers' },
  'white shoes': { female: 'White Leather Sneakers', male: 'White Dress Shoes' },
  'block heels': { female: 'Block Heel Pumps', male: 'Dress Shoes' },
  'heels': { female: 'Classic Block Heels', male: 'Oxford Shoes' },
  'ankle boots': { female: 'Sleek Ankle Boots', male: 'Chelsea Boots' },
  'boots': { female: 'Versatile Ankle Boots', male: 'Classic Chelsea Boots' },
  'dress shoes': { female: 'Pointed Toe Flats', male: 'Oxford Dress Shoes' },
  'ballet flats': { female: 'Classic Ballet Flats', male: 'Casual Loafers' },
  'flats': { female: 'Comfortable Ballet Flats', male: 'Leather Loafers' },
  'sandals': { female: 'Strappy Block Sandals', male: 'Leather Sandals' },
  'strappy sandals': { female: 'Elegant Strappy Sandals', male: 'Brown Leather Sandals' },
  
  // Summer/Beach specific footwear
  'breathable shoes': { female: 'Breathable Canvas Sneakers', male: 'Breathable Canvas Sneakers' },
  'light shoes': { female: 'Light Canvas Shoes', male: 'Light Canvas Shoes' },
  
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
  'light cardigan': { female: 'Light Cotton Cardigan', male: 'Light Cotton Cardigan' },
  'blazer': { female: 'Tailored Blazer', male: 'Navy Blazer' },
  'structured blazer': { female: 'Sharp Tailored Blazer', male: 'Classic Navy Blazer' },
  'light blazer': { female: 'Light Linen Blazer', male: 'Light Linen Blazer' },
  'jacket': { female: 'Cropped Denim Jacket', male: 'Casual Denim Jacket' },
  'denim jacket': { female: 'Vintage Denim Jacket', male: 'Classic Denim Jacket' },
  'light jacket': { female: 'Light Cotton Jacket', male: 'Light Cotton Jacket' },
  
  // Tops - Enhanced for breathable options
  'shirt': { female: 'Crisp Button-Down Shirt', male: 'White Dress Shirt' },
  'cotton shirt': { female: 'Cotton Button-Down Blouse', male: 'Cotton Dress Shirt' },
  'linen shirt': { female: 'Linen Button-Down Shirt', male: 'Linen Dress Shirt' },
  'light shirt': { female: 'Light Cotton Blouse', male: 'Light Cotton Shirt' },
  'breathable shirt': { female: 'Breathable Cotton Blouse', male: 'Breathable Cotton Shirt' },
  'button down shirt': { female: 'Classic White Blouse', male: 'Crisp White Shirt' },
  'blouse': { female: 'Elegant Silk Blouse', male: 'Cotton Dress Shirt' },
  'top': { female: 'Fitted Blouse', male: 'Casual Polo Shirt' },
  'fitted top': { female: 'Stretch Fitted Top', male: 'Slim Fit T-Shirt' },
  'light top': { female: 'Light Cotton Top', male: 'Light Cotton T-Shirt' },
  'sweater': { female: 'Cashmere Pullover', male: 'Wool Crew Sweater' },
  'light sweater': { female: 'Light Cotton Sweater', male: 'Light Cotton Sweater' },
  
  // Bottoms - Enhanced for summer options
  'jeans': { female: 'High-Waisted Dark Jeans', male: 'Straight Leg Jeans' },
  'high waisted jeans': { female: 'High-Rise Skinny Jeans', male: 'Classic Straight Jeans' },
  'dark jeans': { female: 'Dark Wash Skinny Jeans', male: 'Dark Indigo Jeans' },
  'light jeans': { female: 'Light Wash Jeans', male: 'Light Wash Jeans' },
  'pants': { female: 'High-Waisted Trousers', male: 'Tailored Chinos' },
  'linen pants': { female: 'Linen Wide-Leg Pants', male: 'Linen Chinos' },
  'cotton pants': { female: 'Cotton Wide-Leg Pants', male: 'Cotton Chinos' },
  'light pants': { female: 'Light Cotton Pants', male: 'Light Cotton Chinos' },
  'breathable pants': { female: 'Breathable Cotton Pants', male: 'Breathable Cotton Chinos' },
  'tailored pants': { female: 'Slim Tailored Trousers', male: 'Pressed Dress Pants' },
  'chinos': { female: 'High-Waisted Chinos', male: 'Classic Khaki Chinos' },
  'shorts': { female: 'High-Waisted Shorts', male: 'Casual Chino Shorts' },
  'skirt': { female: 'A-Line Midi Skirt', male: 'Casual Shorts' },
  'midi skirt': { female: 'Elegant Midi Skirt', male: 'Tailored Shorts' },
  
  // Dresses - Enhanced for summer
  'dress': { female: 'A-Line Midi Dress', male: 'Polo Shirt' },
  'midi dress': { female: 'Elegant Midi Dress', male: 'Button-Down Shirt' },
  'cotton dress': { female: 'Cotton A-Line Dress', male: 'Cotton Polo Shirt' },
  'linen dress': { female: 'Linen Midi Dress', male: 'Linen Shirt' },
  'light dress': { female: 'Light Cotton Dress', male: 'Light Cotton Shirt' },
  'breathable dress': { female: 'Breathable Cotton Dress', male: 'Breathable Cotton Shirt' },
};

// Fabric to clothing mapping for better suggestions
const FABRIC_CLOTHING_MAP: Record<string, { female: string; male: string }> = {
  'cotton': { female: 'Cotton A-Line Dress', male: 'Cotton Polo Shirt' },
  'linen': { female: 'Linen Wide-Leg Pants', male: 'Linen Button-Down Shirt' },
  'breathable fabric': { female: 'Breathable Cotton Top', male: 'Breathable Cotton Shirt' },
  'light fabric': { female: 'Light Cotton Blouse', male: 'Light Cotton Shirt' },
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
  
  // Check fabric-only mentions
  if (FABRIC_CLOTHING_MAP[cleanedTerm]) {
    const result = FABRIC_CLOTHING_MAP[cleanedTerm][gender];
    console.log('Fabric match found:', cleanedTerm, '->', result);
    return result;
  }
  
  // Check for partial matches (more precise)
  for (const [key, value] of Object.entries(SPECIFIC_PRODUCT_NAMES)) {
    // Only match if the cleaned term is a subset of the key or vice versa
    if (key.includes(cleanedTerm) && cleanedTerm.length > 3) {
      const result = value[gender];
      console.log('Partial match found:', key, '->', result);
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
