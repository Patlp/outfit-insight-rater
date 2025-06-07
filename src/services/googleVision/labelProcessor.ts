
import { GoogleVisionLabel } from './apiClient';

// Enhanced clothing-related keywords with better categorization
const CLOTHING_KEYWORDS = [
  'shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'hoodie', 't-shirt', 'polo', 'vest', 'coat',
  'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'dress', 'gown',
  'shoes', 'sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers',
  'belt', 'bag', 'purse', 'backpack', 'hat', 'cap', 'scarf', 'gloves',
  'denim', 'leather', 'cotton', 'wool', 'silk', 'linen', 'suede', 'velvet',
  'footwear', 'outerwear', 'underwear', 'swimwear', 'activewear', 'formal wear'
];

export const COLOR_DESCRIPTORS = [
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey', 
  'brown', 'navy', 'beige', 'cream', 'tan', 'olive', 'maroon', 'teal', 'coral', 'burgundy', 'khaki',
  'light', 'dark', 'bright', 'pale', 'deep'
];

export const STYLE_DESCRIPTORS = [
  'casual', 'formal', 'vintage', 'modern', 'classic', 'trendy', 'athletic', 'elegant',
  'fitted', 'loose', 'oversized', 'slim', 'cropped', 'striped', 'plaid', 'checkered', 
  'floral', 'graphic', 'plain', 'solid', 'ripped', 'distressed', 'high-waisted'
];

export const filterClothingLabels = (labels: GoogleVisionLabel[]): GoogleVisionLabel[] => {
  console.log('Filtering labels with grammar rules...');
  return labels.filter(label => {
    const description = label.description.toLowerCase();
    return CLOTHING_KEYWORDS.some(keyword => 
      description.includes(keyword) || keyword.includes(description)
    );
  }).sort((a, b) => b.score - a.score);
};

// Re-export GoogleVisionLabel for other modules
export type { GoogleVisionLabel };
