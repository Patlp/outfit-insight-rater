
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
  console.log('=== PRODUCT SUGGESTION PARSING START ===');
  console.log('Input suggestions:', suggestions);
  console.log('Gender:', gender);
  
  if (!suggestions || suggestions.length === 0) {
    console.log('No suggestions provided, returning empty array');
    return [];
  }

  const extractedProducts: ProductSuggestion[] = [];
  const seenProducts = new Set<string>();
  
  // Process each suggestion to find specific clothing items
  suggestions.forEach((suggestion, index) => {
    console.log(`\n--- Processing suggestion ${index + 1}: "${suggestion}" ---`);
    const products = extractProductsFromSuggestion(suggestion, gender);
    console.log(`Found ${products.length} products in this suggestion`);
    
    products.forEach(product => {
      // Generate context for each product
      product.context = generateContextualDescription(product.category, suggestion);
      
      const key = `${product.searchTerm.toLowerCase()}_${product.category}`;
      console.log(`Checking product key: ${key}`);
      
      if (!seenProducts.has(key) && extractedProducts.length < 3) {
        seenProducts.add(key);
        extractedProducts.push(product);
        console.log(`Added product: ${product.name}`);
      } else {
        console.log(`Skipped product (duplicate or limit reached): ${product.name}`);
      }
    });
  });

  console.log(`\nExtracted ${extractedProducts.length} products before fallbacks`);

  // If we have fewer than 3 products, add smart fallbacks
  if (extractedProducts.length < 3) {
    console.log('Adding fallbacks to reach 3 products...');
    const fallbackSuggestions = generateStrictFallbacks(suggestions, gender, extractedProducts);
    console.log(`Generated ${fallbackSuggestions.length} fallbacks`);
    extractedProducts.push(...fallbackSuggestions);
  }

  // Return exactly 3 suggestions
  const finalProducts = extractedProducts.slice(0, 3);
  console.log(`\n=== FINAL PRODUCTS (${finalProducts.length}) ===`);
  finalProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name} (${product.category})`);
    console.log(`   Search: ${product.searchTerm}`);
    console.log(`   Context: ${product.context}`);
  });
  console.log('=== PRODUCT SUGGESTION PARSING END ===\n');
  
  return finalProducts;
};
