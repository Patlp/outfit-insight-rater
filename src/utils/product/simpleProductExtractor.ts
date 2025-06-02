
import { Gender } from '@/context/RatingContext';
import { createGenderSpecificSearchTerm } from './searchTermGenerator';
import { categorizeProduct } from './productClassifier';
import { getSpecificProductName } from './productNameMapper';

export interface SimpleExtractedProduct {
  name: string;
  context: string;
  category: string;
  searchTerm: string;
  rationale: string;
}

export const extractProductsFromSuggestions = (
  suggestions: string[], 
  gender: Gender,
  feedback: string
): SimpleExtractedProduct[] => {
  console.log('=== SIMPLE PRODUCT EXTRACTION ===');
  console.log('Suggestions:', suggestions);
  console.log('Gender:', gender);
  
  const products: SimpleExtractedProduct[] = [];
  
  // Define clothing item patterns - focusing on common fashion items
  const clothingPatterns = [
    // Basic clothing items
    /(shirt|blouse|top|tee|sweater|cardigan|jacket|blazer|coat|vest)/gi,
    /(pants|jeans|trousers|skirt|dress|shorts|leggings)/gi,
    /(shoes|sneakers|boots|heels|flats|sandals|pumps|loafers)/gi,
    /(necklace|bracelet|watch|belt|bag|purse|scarf|hat|earrings)/gi
  ];
  
  // Process each suggestion
  suggestions.forEach((suggestion, index) => {
    console.log(`Processing suggestion ${index + 1}: "${suggestion}"`);
    
    clothingPatterns.forEach((pattern) => {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(suggestion.toLowerCase())) !== null && products.length < 3) {
        const item = match[1];
        
        // Check if we already have a similar item
        const isDuplicate = products.some(p => 
          p.searchTerm.toLowerCase().includes(item) || 
          item.includes(p.searchTerm.toLowerCase().split(' ').pop() || '')
        );
        
        if (!isDuplicate) {
          const specificName = getSpecificProductName(item, gender);
          const searchTerm = createGenderSpecificSearchTerm(item, gender);
          const category = categorizeProduct(item);
          const rationale = generateRationale(suggestion, item);
          
          // Extract context from the suggestion
          const context = extractContextFromSuggestion(suggestion, item);
          
          const product: SimpleExtractedProduct = {
            name: `${rationale}: ${specificName}`,
            context: context,
            category,
            searchTerm,
            rationale
          };
          
          console.log('Adding product:', product);
          products.push(product);
        }
      }
    });
  });
  
  console.log(`Extracted ${products.length} products`);
  return products.slice(0, 3);
};

const generateRationale = (suggestion: string, item: string): string => {
  const lowerSuggestion = suggestion.toLowerCase();
  
  if (lowerSuggestion.includes('professional') || lowerSuggestion.includes('work')) {
    return 'Professional Polish';
  }
  if (lowerSuggestion.includes('casual') || lowerSuggestion.includes('relaxed')) {
    return 'Casual Refinement';
  }
  if (lowerSuggestion.includes('color') || lowerSuggestion.includes('complement')) {
    return 'Color Coordination';
  }
  if (lowerSuggestion.includes('layer') || lowerSuggestion.includes('warmth')) {
    return 'Layer Addition';
  }
  if (lowerSuggestion.includes('structure') || lowerSuggestion.includes('tailored')) {
    return 'Structure Addition';
  }
  
  // Item-based fallback
  if (item.includes('shoe') || item.includes('boot') || item.includes('sneaker')) {
    return 'Foundation Upgrade';
  }
  if (item.includes('jacket') || item.includes('blazer') || item.includes('cardigan')) {
    return 'Layer Addition';
  }
  if (item.includes('necklace') || item.includes('belt') || item.includes('watch')) {
    return 'Finishing Touch';
  }
  
  return 'Style Enhancement';
};

const extractContextFromSuggestion = (suggestion: string, item: string): string => {
  // Extract the key benefit or reason from the suggestion
  const lowerSuggestion = suggestion.toLowerCase();
  
  if (lowerSuggestion.includes('elevate') || lowerSuggestion.includes('polish')) {
    return `This ${item} will elevate your overall look with a more polished appearance.`;
  }
  if (lowerSuggestion.includes('professional') || lowerSuggestion.includes('work')) {
    return `Perfect for a professional setting, this ${item} adds workplace-appropriate style.`;
  }
  if (lowerSuggestion.includes('casual') || lowerSuggestion.includes('comfortable')) {
    return `This ${item} brings comfort and casual sophistication to your outfit.`;
  }
  if (lowerSuggestion.includes('color') || lowerSuggestion.includes('complement')) {
    return `This ${item} will create better color harmony in your outfit.`;
  }
  if (lowerSuggestion.includes('structure') || lowerSuggestion.includes('shape')) {
    return `This ${item} adds structure and improves your outfit's silhouette.`;
  }
  
  return `This ${item} will complement your personal style and enhance your overall appearance.`;
};
