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
  
  // Define specific product patterns with better detection
  const productPatterns = [
    // Specific clothing items with better matching
    /(?:white|dress|button[\s-]?down|polo|oxford|flannel|linen)\s+(shirt|blouse)/gi,
    /(?:dark|high[\s-]?waisted|straight|skinny|slim|bootcut)\s+(jeans|pants|trousers)/gi,
    /(?:white|leather|canvas|athletic|running|dress)\s+(sneakers|shoes|boots|loafers)/gi,
    /(?:structured|tailored|navy|black|casual)\s+(blazer|jacket|cardigan)/gi,
    /(?:statement|delicate|gold|silver|layered)\s+(necklace|earrings|bracelet)/gi,
    /(?:leather|metal|classic|minimalist)\s+(watch|belt)/gi,
    /(?:crossbody|leather|structured|canvas)\s+(bag|purse)/gi,
    
    // General patterns for backup
    /(shirt|blouse|top|sweater|cardigan|jacket|blazer|coat)/gi,
    /(pants|jeans|trousers|skirt|dress|shorts|chinos)/gi,
    /(shoes|sneakers|boots|heels|flats|loafers|sandals)/gi,
    /(necklace|bracelet|watch|belt|bag|scarf|earrings)/gi
  ];
  
  // Process each suggestion
  suggestions.forEach((suggestion, index) => {
    console.log(`Processing suggestion ${index + 1}: "${suggestion}"`);
    
    productPatterns.forEach((pattern) => {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(suggestion)) !== null && products.length < 2) {
        const fullMatch = match[0].toLowerCase();
        const item = match[1] || match[0];
        
        console.log(`Found potential product: "${fullMatch}"`);
        
        // Check if we already have a similar item
        const isDuplicate = products.some(p => 
          p.searchTerm.toLowerCase().includes(item.toLowerCase()) || 
          item.toLowerCase().includes(p.searchTerm.toLowerCase().split(' ').pop() || '')
        );
        
        if (!isDuplicate) {
          // Use the full match for more specific product naming
          const specificName = getSpecificProductName(fullMatch, gender);
          const searchTerm = createCleanSearchTerm(fullMatch, gender);
          const category = categorizeProduct(item);
          const rationale = generateRationale(suggestion, fullMatch);
          
          // Extract context from the suggestion
          const context = extractContextFromSuggestion(suggestion, fullMatch);
          
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
  return products.slice(0, 2);
};

const createCleanSearchTerm = (productMatch: string, gender: Gender): string => {
  // Clean the product match and create a focused search term
  const cleanProduct = productMatch
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const genderPrefix = gender === 'male' ? 'mens' : 'womens';
  
  // Don't add gender prefix if it's already there
  if (cleanProduct.includes('mens') || cleanProduct.includes('womens')) {
    return cleanProduct;
  }
  
  return `${genderPrefix} ${cleanProduct}`;
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
  const baseItem = item.split(' ').pop() || item;
  
  if (lowerSuggestion.includes('elevate') || lowerSuggestion.includes('polish')) {
    return `This ${baseItem} will elevate your overall look with a more polished appearance.`;
  }
  if (lowerSuggestion.includes('professional') || lowerSuggestion.includes('work')) {
    return `Perfect for a professional setting, this ${baseItem} adds workplace-appropriate style.`;
  }
  if (lowerSuggestion.includes('casual') || lowerSuggestion.includes('comfortable')) {
    return `This ${baseItem} brings comfort and casual sophistication to your outfit.`;
  }
  if (lowerSuggestion.includes('color') || lowerSuggestion.includes('complement')) {
    return `This ${baseItem} will create better color harmony in your outfit.`;
  }
  if (lowerSuggestion.includes('structure') || lowerSuggestion.includes('shape')) {
    return `This ${baseItem} adds structure and improves your outfit's silhouette.`;
  }
  
  return `This ${baseItem} will complement your personal style and enhance your overall appearance.`;
};
