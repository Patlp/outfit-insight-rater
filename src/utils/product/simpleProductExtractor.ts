
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
        p.searchTerm.toLowerCase().includes(attributes.clothingType) ||
        similarFashionPhrases(p.searchTerm, attributes.fullPhrase)
      );
      
      if (!isDuplicate) {
        const cleanProductName = createCleanProductName(attributes);
        const searchTerm = buildAmazonSearchQuery(attributes);
        const category = categorizeProduct(attributes.clothingType);
        const rationale = generateRationale(suggestion, attributes.fullPhrase);
        
        // Extract context from the suggestion using the full phrase
        const context = extractContextFromSuggestion(suggestion, attributes.fullPhrase || attributes.clothingType);
        
        // Use the clean product name directly in the title
        const product: SimpleExtractedProduct = {
          name: `${rationale}: ${cleanProductName}`,
          context: context,
          category,
          searchTerm,
          rationale
        };
        
        console.log('Adding product:', product);
        console.log('Full phrase used:', attributes.fullPhrase);
        console.log('Search term generated:', searchTerm);
        products.push(product);
      }
    }
  });
  
  console.log(`Extracted ${products.length} products`);
  return products.slice(0, 2);
};

const similarFashionPhrases = (phrase1: string, phrase2: string): boolean => {
  const words1 = phrase1.toLowerCase().split(/\s+/);
  const words2 = phrase2.toLowerCase().split(/\s+/);
  
  // Check if they share significant clothing-related words
  const commonWords = words1.filter(word => words2.includes(word));
  const clothingWords = commonWords.filter(word => 
    ['shirt', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'dress', 'pants', 'jeans', 'shoes', 'sneakers', 'boots'].includes(word)
  );
  
  return clothingWords.length > 0;
};

const generateRationale = (suggestion: string, fullPhrase: string): string => {
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
  
  // Item-based fallback using full phrase
  const lowerPhrase = fullPhrase.toLowerCase();
  if (lowerPhrase.includes('shoe') || lowerPhrase.includes('boot') || lowerPhrase.includes('sneaker')) {
    return 'Foundation Upgrade';
  }
  if (lowerPhrase.includes('jacket') || lowerPhrase.includes('blazer') || lowerPhrase.includes('cardigan')) {
    return 'Layer Addition';
  }
  if (lowerPhrase.includes('necklace') || lowerPhrase.includes('belt') || lowerPhrase.includes('watch')) {
    return 'Finishing Touch';
  }
  
  return 'Style Enhancement';
};

const extractContextFromSuggestion = (suggestion: string, fullPhrase: string): string => {
  // Extract the key benefit or reason from the suggestion
  const lowerSuggestion = suggestion.toLowerCase();
  
  if (lowerSuggestion.includes('elevate') || lowerSuggestion.includes('polish')) {
    return `This ${fullPhrase} will elevate your overall look with a more polished appearance.`;
  }
  if (lowerSuggestion.includes('professional') || lowerSuggestion.includes('work')) {
    return `Perfect for a professional setting, this ${fullPhrase} adds workplace-appropriate style.`;
  }
  if (lowerSuggestion.includes('casual') || lowerSuggestion.includes('comfortable')) {
    return `This ${fullPhrase} brings comfort and casual sophistication to your outfit.`;
  }
  if (lowerSuggestion.includes('color') || lowerSuggestion.includes('complement')) {
    return `This ${fullPhrase} will create better color harmony in your outfit.`;
  }
  if (lowerSuggestion.includes('structure') || lowerSuggestion.includes('shape')) {
    return `This ${fullPhrase} adds structure and improves your outfit's silhouette.`;
  }
  if (lowerSuggestion.includes('summer') || lowerSuggestion.includes('breezy')) {
    return `This ${fullPhrase} is perfect for warm weather and summer styling.`;
  }
  if (lowerSuggestion.includes('lightweight') || lowerSuggestion.includes('breathable')) {
    return `This ${fullPhrase} offers comfort and breathability for all-day wear.`;
  }
  
  return `This ${fullPhrase} will complement your personal style and enhance your overall appearance.`;
};
