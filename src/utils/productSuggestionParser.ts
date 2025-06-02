
import { Gender } from '@/context/RatingContext';
import { extractProductsFromSuggestion } from './product/productExtractorV2';
import { generateContextualDescription } from './product/contextGenerator';
import { generateStrictFallbacks } from './product/fallbackGenerator';

export interface ProductSuggestion {
  name: string;
  context: string;
  category: string;
  searchTerm: string;
  rationale: string;
}

export const parseProductSuggestions = (
  suggestions: string[], 
  gender: Gender
): ProductSuggestion[] => {
  console.log('Parsing product suggestions from style suggestions only, gender:', gender);
  
  if (!suggestions || suggestions.length === 0) {
    return [];
  }

  const extractedProducts: ProductSuggestion[] = [];
  const seenProducts = new Set<string>();
  
  // Process each suggestion to find specific clothing items
  suggestions.forEach(suggestion => {
    const products = extractProductsFromSuggestion(suggestion, gender);
    products.forEach(product => {
      // Generate context for each product
      product.context = generateContextualDescription(product.category, suggestion);
      
      const key = `${product.searchTerm.toLowerCase()}_${product.rationale.toLowerCase()}`;
      if (!seenProducts.has(key) && extractedProducts.length < 3) {
        seenProducts.add(key);
        extractedProducts.push(product);
      }
    });
  });

  // If we have fewer than 3 products, add smart fallbacks
  if (extractedProducts.length < 3) {
    const fallbackSuggestions = generateStrictFallbacks(suggestions, gender, extractedProducts);
    extractedProducts.push(...fallbackSuggestions);
  }

  // Return exactly 3 suggestions
  return extractedProducts.slice(0, 3);
};
