
import { Gender } from '@/context/RatingContext';
import { extractProductsWithNLP, ExtractedProduct } from './nlpExtractor';

export interface SimplifiedProduct {
  name: string;
  context: string;
  searchTerm: string;
  amazonUrl: string;
}

export const extractSimplifiedProducts = (
  suggestions: string[], 
  gender: Gender
): SimplifiedProduct[] => {
  console.log('=== SIMPLIFIED PRODUCT EXTRACTION (Using NLP) ===');
  console.log('Suggestions:', suggestions);
  console.log('Gender:', gender);
  
  // Use the new NLP extractor
  const nlpProducts = extractProductsWithNLP(suggestions, gender);
  
  // Convert to SimplifiedProduct format
  const simplifiedProducts: SimplifiedProduct[] = nlpProducts.map(product => ({
    name: product.name,
    context: product.context,
    searchTerm: product.searchTerm,
    amazonUrl: product.amazonUrl
  }));
  
  console.log(`=== FINAL SIMPLIFIED PRODUCTS (${simplifiedProducts.length}) ===`);
  simplifiedProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Search: ${product.searchTerm}`);
    console.log(`   URL: ${product.amazonUrl}`);
  });
  
  return simplifiedProducts;
};
