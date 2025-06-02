
import { Gender } from '@/context/RatingContext';
import { TextProcessor } from './textProcessor';

export interface ProductSuggestion {
  name: string;
  context: string;
  category: string;
  searchTerm: string;
}

const CONTEXTUAL_DESCRIPTIONS: Record<string, string> = {
  footwear: 'The right shoes can completely transform your look and add the perfect finishing touch',
  accessories: 'Strategic accessories add personality and polish to elevate your entire outfit',
  outerwear: 'A well-chosen outer layer adds structure and sophistication to your style',
  tops: 'The right top creates a strong foundation for your overall look',
  bottoms: 'Well-fitted bottoms are essential for a polished, put-together appearance',
  dresses: 'The perfect dress makes getting dressed effortless while looking effortlessly chic',
  fashion: 'This piece would complement your personal style perfectly'
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
  
  // Convert to ProductSuggestion format
  const productSuggestions: ProductSuggestion[] = extractedProducts.map(product => {
    const genderSpecificSearchTerm = TextProcessor.createGenderSpecificSearchTerm(
      product.searchTerm, 
      gender
    );
    
    return {
      name: formatProductName(product.cleanedName),
      context: CONTEXTUAL_DESCRIPTIONS[product.category] || CONTEXTUAL_DESCRIPTIONS.fashion,
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

function formatProductName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function generateFallbackSuggestions(
  text: string, 
  gender: Gender, 
  existingSuggestions: ProductSuggestion[]
): ProductSuggestion[] {
  const fallbacks: ProductSuggestion[] = [];
  const existingCategories = new Set(existingSuggestions.map(s => s.category));
  
  // Gender-specific fallback suggestions
  const genderFallbacks = gender === 'female' 
    ? [
        { name: 'Statement Earrings', category: 'accessories', searchTerm: 'statement earrings' },
        { name: 'Block Heels', category: 'footwear', searchTerm: 'block heel shoes' },
        { name: 'Structured Blazer', category: 'outerwear', searchTerm: 'structured blazer' },
        { name: 'Midi Dress', category: 'dresses', searchTerm: 'midi dress' },
        { name: 'Crossbody Bag', category: 'accessories', searchTerm: 'crossbody bag' }
      ]
    : [
        { name: 'Leather Watch', category: 'accessories', searchTerm: 'leather strap watch' },
        { name: 'White Sneakers', category: 'footwear', searchTerm: 'white leather sneakers' },
        { name: 'Button Down Shirt', category: 'tops', searchTerm: 'button down shirt' },
        { name: 'Chino Pants', category: 'bottoms', searchTerm: 'chino pants' },
        { name: 'Casual Blazer', category: 'outerwear', searchTerm: 'casual blazer' }
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
        context: CONTEXTUAL_DESCRIPTIONS[fallback.category] || CONTEXTUAL_DESCRIPTIONS.fashion,
        category: fallback.category,
        searchTerm: genderSpecificSearchTerm
      });
      
      existingCategories.add(fallback.category);
    }
  }

  return fallbacks;
}
