
import { Gender } from '@/context/RatingContext';
import { categorizeProduct } from './productClassifier';
import { extractFashionAttributes, buildAmazonSearchQuery, createCleanProductName } from './fashionAttributeExtractor';

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
  
  // Process each suggestion
  suggestions.forEach((suggestion, index) => {
    console.log(`Processing suggestion ${index + 1}: "${suggestion}"`);
    
    if (products.length < 2) {
      // Extract fashion attributes from the entire suggestion
      const attributes = extractFashionAttributes(suggestion, gender);
      
      // Check if we already have a similar item
      const isDuplicate = products.some(p => 
        p.category === categorizeProduct(attributes.clothingType) ||
        p.searchTerm.toLowerCase().includes(attributes.clothingType)
      );
      
      if (!isDuplicate) {
        const cleanProductName = createCleanProductName(attributes);
        const searchTerm = buildAmazonSearchQuery(attributes);
        const category = categorizeProduct(attributes.clothingType);
        const rationale = generateRationale(suggestion, attributes.clothingType);
        
        // Extract context from the suggestion
        const context = extractContextFromSuggestion(suggestion, attributes.fullPhrase || attributes.clothingType);
        
        // Use the full fashion phrase in the product name
        const product: SimpleExtractedProduct = {
          name: `${rationale}: ${cleanProductName}`,
          context: context,
          category,
          searchTerm,
          rationale
        };
        
        console.log('Adding product:', product);
        console.log('Full phrase used:', attributes.fullPhrase);
        products.push(product);
      }
    }
  });
  
  console.log(`Extracted ${products.length} products`);
  return products.slice(0, 2);
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
  if (lowerSuggestion.includes('summer') || lowerSuggestion.includes('breezy')) {
    return `This ${item} is perfect for warm weather and summer styling.`;
  }
  
  return `This ${item} will complement your personal style and enhance your overall appearance.`;
};
