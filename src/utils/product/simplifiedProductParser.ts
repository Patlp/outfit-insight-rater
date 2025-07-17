
import { Gender } from '@/context/RatingContext';
import { extractProductsFromSuggestions } from './simpleProductExtractor';

export interface SimplifiedProductSuggestion {
  name: string;
  context: string;
  category: string;
  searchTerm: string;
  rationale: string;
}

export const parseProductSuggestionsSimplified = (
  suggestions: string[], 
  gender: Gender,
  feedback: string
): SimplifiedProductSuggestion[] => {
  console.log('=== SIMPLIFIED PRODUCT PARSING ===');
  console.log('Input suggestions:', suggestions);
  console.log('Gender:', gender);
  
  if (!suggestions || suggestions.length === 0) {
    console.log('No suggestions provided, returning empty array');
    return [];
  }

  // Extract products directly from AI suggestions
  const extractedProducts = extractProductsFromSuggestions(suggestions, gender, feedback);
  
  // If we have fewer than 3 products, add some basic fallbacks
  if (extractedProducts.length < 3) {
    const fallbacks = generateBasicFallbacks(gender, extractedProducts);
    extractedProducts.push(...fallbacks.slice(0, 3 - extractedProducts.length));
  }

  const finalProducts = extractedProducts.slice(0, 3);
  console.log(`=== FINAL SIMPLIFIED PRODUCTS (${finalProducts.length}) ===`);
  finalProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Category: ${product.category}`);
    console.log(`   Search: ${product.searchTerm}`);
    console.log(`   Context: ${product.context}`);
  });
  
  return finalProducts;
};

const generateBasicFallbacks = (gender: Gender, existingProducts: SimplifiedProductSuggestion[]): SimplifiedProductSuggestion[] => {
  const fallbacks: SimplifiedProductSuggestion[] = [];
  const existingCategories = existingProducts.map(p => p.category);
  
  // Basic fallback items that work for most situations
  const basicItems = [
    { item: 'white sneakers', category: 'footwear', rationale: 'Foundation Upgrade' },
    { item: 'classic watch', category: 'accessories', rationale: 'Finishing Touch' },
    { item: 'structured blazer', category: 'outerwear', rationale: 'Professional Polish' }
  ];
  
  for (const { item, category, rationale } of basicItems) {
    if (!existingCategories.includes(category) && fallbacks.length < 2) {
      const genderPrefix = gender === 'male' ? 'mens' : 'womens';
      fallbacks.push({
        name: `${rationale}: ${item}`,
        context: `This ${item} is a versatile piece that works well with most outfits.`,
        category,
        searchTerm: `${genderPrefix} ${item}`,
        rationale
      });
    }
  }
  
  return fallbacks;
};
