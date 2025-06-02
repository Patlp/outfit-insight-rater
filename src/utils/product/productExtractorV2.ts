
import { Gender } from '@/context/RatingContext';
import { createGenderSpecificSearchTerm } from './searchTermGenerator';
import { categorizeProduct } from './productClassifier';
import { getSpecificProductName } from './productNameMapper';
import { cleanProductName } from './textCleaner';
import { isValidClothingItem } from './clothingValidator';
import { extractStyleRationale } from './rationaleExtractor';
import { getActionPatterns } from './regexPatterns';

export interface ExtractedProductV2 {
  name: string;
  context: string;
  category: string;
  searchTerm: string;
  rationale: string;
}

export const extractProductsFromSuggestion = (suggestion: string, gender: Gender): ExtractedProductV2[] => {
  console.log('=== EXTRACTING PRODUCTS ===');
  console.log('Suggestion:', suggestion);
  console.log('Gender:', gender);
  
  const products: ExtractedProductV2[] = [];
  const actionPatterns = getActionPatterns();

  const lowerSuggestion = suggestion.toLowerCase();
  console.log('Processing suggestion (lowercase):', lowerSuggestion);
  
  actionPatterns.forEach((pattern, index) => {
    let match;
    pattern.lastIndex = 0; // Reset regex
    
    while ((match = pattern.exec(lowerSuggestion)) !== null && products.length < 5) {
      const extractedItem = match[1]?.trim();
      console.log(`Pattern ${index + 1} found:`, extractedItem);
      
      if (!extractedItem || extractedItem.length < 3) {
        console.log('Skipping - too short:', extractedItem);
        continue;
      }
      
      const cleanedItem = cleanProductName(extractedItem);
      console.log('Cleaned item:', cleanedItem);
      
      if (!cleanedItem || !isValidClothingItem(cleanedItem)) {
        console.log('Skipping - not valid clothing:', cleanedItem);
        continue;
      }
      
      // Enhanced duplicate checking
      const isDuplicate = products.some(p => 
        p.searchTerm.toLowerCase().includes(cleanedItem.toLowerCase()) ||
        cleanedItem.toLowerCase().includes(p.searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(cleanedItem.toLowerCase())
      );
      
      if (isDuplicate) {
        console.log('Skipping - duplicate:', cleanedItem);
        continue;
      }
      
      const rationale = extractStyleRationale(suggestion, cleanedItem);
      const specificName = getSpecificProductName(cleanedItem, gender);
      const searchTerm = createGenderSpecificSearchTerm(cleanedItem, gender);
      const category = categorizeProduct(cleanedItem);
      
      const product = {
        name: `${rationale}: ${specificName}`,
        context: '', // Will be set by context generator
        category,
        searchTerm,
        rationale
      };
      
      console.log('Adding product:', product);
      products.push(product);
    }
  });

  console.log(`Found ${products.length} products from suggestion`);
  return products.slice(0, 3); // Limit to 3 products
};
