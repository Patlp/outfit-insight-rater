
import { Gender } from '@/context/RatingContext';
import { extractProductsFromSuggestion } from './productExtractorV3';
import { generateContextualDescription } from './contextGenerator';
import { generateStrictFallbacks } from './fallbackGeneratorV2';

export interface ProductSuggestionV2 {
  name: string;
  context: string;
  category: string;
  searchTerm: string;
  rationale: string;
}

export const parseProductSuggestions = (
  suggestions: string[], 
  gender: Gender
): ProductSuggestionV2[] => {
  console.log('=== PRODUCT SUGGESTION PARSING V2 START ===');
  console.log('Input suggestions:', suggestions);
  console.log('Gender:', gender);
  
  if (!suggestions || suggestions.length === 0) {
    console.log('No suggestions provided, returning empty array');
    return [];
  }

  const extractedProducts: ProductSuggestionV2[] = [];
  const seenProducts = new Set<string>();
  
  // Process each suggestion to find specific clothing items
  suggestions.forEach((suggestion, index) => {
    console.log(`\n--- Processing suggestion ${index + 1}: "${suggestion}" ---`);
    const products = extractProductsFromSuggestion(suggestion, gender);
    console.log(`Found ${products.length} products in this suggestion`);
    
    products.forEach(product => {
      // Generate context for each product
      product.context = generateContextualDescription(product.category, suggestion);
      
      // Create a more comprehensive key for duplicate detection
      const key = `${product.searchTerm.toLowerCase()}_${product.category}`;
      console.log(`Checking product key: ${key}`);
      
      if (!seenProducts.has(key) && extractedProducts.length < 3) {
        seenProducts.add(key);
        extractedProducts.push(product);
        console.log(`✓ Added product: ${product.name}`);
        console.log(`  Category: ${product.category}`);
        console.log(`  Search term: ${product.searchTerm}`);
        console.log(`  Rationale: ${product.rationale}`);
      } else {
        console.log(`✗ Skipped product (duplicate or limit reached): ${product.name}`);
      }
    });
  });

  console.log(`\nExtracted ${extractedProducts.length} products before fallbacks`);

  // If we have fewer than 3 products, add smart fallbacks
  if (extractedProducts.length < 3) {
    console.log('Adding fallbacks to reach 3 products...');
    const fallbackSuggestions = generateStrictFallbacks(suggestions, gender, extractedProducts);
    console.log(`Generated ${fallbackSuggestions.length} fallbacks`);
    
    // Add fallbacks up to limit of 3 total
    const remainingSlots = 3 - extractedProducts.length;
    const fallbacksToAdd = fallbackSuggestions.slice(0, remainingSlots);
    extractedProducts.push(...fallbacksToAdd);
    
    console.log(`Added ${fallbacksToAdd.length} fallbacks`);
  }

  // Return exactly 3 suggestions (or fewer if that's all we have)
  const finalProducts = extractedProducts.slice(0, 3);
  console.log(`\n=== FINAL PRODUCTS V2 (${finalProducts.length}) ===`);
  finalProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Category: ${product.category}`);
    console.log(`   Search: ${product.searchTerm}`);
    console.log(`   Context: ${product.context}`);
    console.log(`   Rationale: ${product.rationale}`);
    console.log('');
  });
  console.log('=== PRODUCT SUGGESTION PARSING V2 END ===\n');
  
  return finalProducts;
};
