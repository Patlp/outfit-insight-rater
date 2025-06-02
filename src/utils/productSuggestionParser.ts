
import { Gender } from '@/context/RatingContext';
import { TextProcessor } from './textProcessor';

export interface ProductSuggestion {
  name: string;
  context: string;
  category: string;
  searchTerm: string;
}

const SPECIFIC_PRODUCT_NAMES: Record<string, { female: string; male: string }> = {
  // Footwear
  'white sneakers': { female: 'White Leather Sneakers', male: 'White Leather Sneakers' },
  'block heels': { female: 'Block Heel Pumps', male: 'Dress Shoes' },
  'ankle boots': { female: 'Ankle Boots', male: 'Chelsea Boots' },
  'dress shoes': { female: 'Pointed Toe Flats', male: 'Oxford Dress Shoes' },
  'ballet flats': { female: 'Classic Ballet Flats', male: 'Loafers' },
  'strappy sandals': { female: 'Strappy Heeled Sandals', male: 'Leather Sandals' },
  
  // Accessories
  'statement necklace': { female: 'Statement Gold Necklace', male: 'Chain Necklace' },
  'leather watch': { female: 'Leather Strap Watch', male: 'Leather Strap Watch' },
  'crossbody bag': { female: 'Structured Crossbody Bag', male: 'Messenger Bag' },
  'leather belt': { female: 'Slim Leather Belt', male: 'Brown Leather Belt' },
  'stud earrings': { female: 'Gold Stud Earrings', male: 'Cufflinks' },
  'silk scarf': { female: 'Silk Square Scarf', male: 'Pocket Square' },
  
  // Clothing
  'structured blazer': { female: 'Tailored Blazer', male: 'Navy Blazer' },
  'button down shirt': { female: 'Crisp White Blouse', male: 'White Button Down Shirt' },
  'midi dress': { female: 'A-Line Midi Dress', male: 'Polo Shirt' },
  'high waisted jeans': { female: 'High-Waisted Dark Jeans', male: 'Straight Leg Jeans' },
  'tailored pants': { female: 'High-Waisted Trousers', male: 'Tailored Chinos' },
  'knit cardigan': { female: 'Oversized Knit Cardigan', male: 'V-Neck Sweater' },
  'fitted top': { female: 'Fitted Blouse', male: 'Fitted T-Shirt' },
  'midi skirt': { female: 'A-Line Midi Skirt', male: 'Chino Shorts' },
};

export const parseProductSuggestions = (
  feedback: string, 
  suggestions: string[], 
  gender: Gender
): ProductSuggestion[] => {
  console.log('Parsing product suggestions with gender:', gender);
  
  // Combine all text sources
  const combinedText = `${feedback} ${suggestions.join(' ')}`;
  
  // Extract products using our enhanced text processor
  const extractedProducts = TextProcessor.extractProductMentions(combinedText);
  
  console.log('Extracted products:', extractedProducts);
  
  // Convert to ProductSuggestion format with specific names
  const productSuggestions: ProductSuggestion[] = extractedProducts.map(product => {
    const genderSpecificSearchTerm = TextProcessor.createGenderSpecificSearchTerm(
      product.searchTerm, 
      gender
    );
    
    // Get specific product name based on gender
    const specificName = getSpecificProductName(product.searchTerm, gender);
    
    return {
      name: specificName,
      context: generateContextualDescription(product.category, combinedText),
      category: product.category,
      searchTerm: genderSpecificSearchTerm
    };
  });

  // If we have fewer than 3 products, add some smart fallbacks based on the feedback content
  if (productSuggestions.length < 3) {
    const fallbackSuggestions = generateFallbackSuggestions(combinedText, gender, productSuggestions);
    productSuggestions.push(...fallbackSuggestions);
  }

  // Return exactly 3 suggestions
  return productSuggestions.slice(0, 3);
};

function getSpecificProductName(searchTerm: string, gender: Gender): string {
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
}

function generateContextualDescription(category: string, fullText: string): string {
  const lowerText = fullText.toLowerCase();
  
  // Context-aware descriptions based on the feedback content
  if (lowerText.includes('professional') || lowerText.includes('work')) {
    switch (category) {
      case 'footwear': return 'Professional footwear that maintains comfort while elevating your workplace style';
      case 'accessories': return 'Sophisticated accessories that add polish to your professional wardrobe';
      case 'outerwear': return 'Professional outerwear that creates structure and authority in your look';
      default: return 'This piece will enhance your professional appearance and boost confidence';
    }
  }
  
  if (lowerText.includes('casual') || lowerText.includes('weekend')) {
    switch (category) {
      case 'footwear': return 'Versatile shoes that work for casual occasions while keeping you looking put-together';
      case 'accessories': return 'Effortless accessories that elevate casual looks without being overdressed';
      default: return 'Perfect for creating polished casual looks that feel authentic to your style';
    }
  }
  
  if (lowerText.includes('color') || lowerText.includes('palette')) {
    return 'This piece will help coordinate your color palette and create more cohesive outfits';
  }
  
  if (lowerText.includes('fit') || lowerText.includes('silhouette')) {
    return 'Designed to enhance your silhouette and create a more flattering overall appearance';
  }
  
  // Default descriptions by category
  const defaultDescriptions: Record<string, string> = {
    footwear: 'The right shoes can completely transform your look and add the perfect finishing touch',
    accessories: 'Strategic accessories add personality and polish to elevate your entire outfit',
    outerwear: 'A well-chosen outer layer adds structure and sophistication to your style',
    tops: 'The right top creates a strong foundation for your overall look',
    bottoms: 'Well-fitted bottoms are essential for a polished, put-together appearance',
    dresses: 'The perfect dress makes getting dressed effortless while looking effortlessly chic',
    fashion: 'This piece would complement your personal style perfectly'
  };
  
  return defaultDescriptions[category] || defaultDescriptions.fashion;
}

function generateFallbackSuggestions(
  text: string, 
  gender: Gender, 
  existingSuggestions: ProductSuggestion[]
): ProductSuggestion[] {
  const fallbacks: ProductSuggestion[] = [];
  const existingCategories = new Set(existingSuggestions.map(s => s.category));
  
  // Gender-specific fallback suggestions with specific names
  const genderFallbacks = gender === 'female' 
    ? [
        { name: 'Gold Stud Earrings', category: 'accessories', searchTerm: 'gold stud earrings' },
        { name: 'Block Heel Pumps', category: 'footwear', searchTerm: 'block heel pumps' },
        { name: 'Tailored Blazer', category: 'outerwear', searchTerm: 'structured blazer' },
        { name: 'A-Line Midi Dress', category: 'dresses', searchTerm: 'midi dress' },
        { name: 'Structured Crossbody Bag', category: 'accessories', searchTerm: 'crossbody bag' }
      ]
    : [
        { name: 'Leather Strap Watch', category: 'accessories', searchTerm: 'leather strap watch' },
        { name: 'White Leather Sneakers', category: 'footwear', searchTerm: 'white leather sneakers' },
        { name: 'White Button Down Shirt', category: 'tops', searchTerm: 'button down shirt' },
        { name: 'Tailored Chinos', category: 'bottoms', searchTerm: 'chino pants' },
        { name: 'Navy Blazer', category: 'outerwear', searchTerm: 'casual blazer' }
      ];

  // Add fallbacks that don't conflict with existing categories
  for (const fallback of genderFallbacks) {
    if (fallbacks.length >= 3 - existingSuggestions.length) break;
    
    if (!existingCategories.has(fallback.category)) {
      const genderSpecificSearchTerm = TextProcessor.createGenderSpecificSearchTerm(
        fallback.searchTerm, 
        gender
      );
      
      fallbacks.push({
        name: fallback.name,
        context: generateContextualDescription(fallback.category, text),
        category: fallback.category,
        searchTerm: genderSpecificSearchTerm
      });
      
      existingCategories.add(fallback.category);
    }
  }

  return fallbacks;
}
