
import { Gender } from '@/context/RatingContext';

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
  console.log('=== SIMPLIFIED PRODUCT EXTRACTION ===');
  console.log('Suggestions:', suggestions);
  console.log('Gender:', gender);
  
  const products: SimplifiedProduct[] = [];
  
  // Process each suggestion to extract products
  suggestions.forEach((suggestion, index) => {
    console.log(`Processing suggestion ${index + 1}: "${suggestion}"`);
    
    if (products.length < 2) {
      const extractedPhrase = extractTargetPhrase(suggestion);
      
      if (extractedPhrase) {
        // Check for duplicates
        const isDuplicate = products.some(p => 
          p.searchTerm.toLowerCase().includes(extractedPhrase.toLowerCase()) ||
          extractedPhrase.toLowerCase().includes(p.searchTerm.toLowerCase())
        );
        
        if (!isDuplicate) {
          const product = buildProduct(extractedPhrase, suggestion, gender);
          products.push(product);
          console.log('Added product:', product);
        }
      }
    }
  });
  
  // Add fallback if we don't have enough products
  while (products.length < 2) {
    const fallbackProduct: SimplifiedProduct = {
      name: "Style Enhancement: Top",
      context: "A versatile piece that will enhance your overall look.",
      searchTerm: `${gender === 'male' ? 'mens' : 'womens'} top`,
      amazonUrl: ""
    };
    products.push(fallbackProduct);
  }
  
  console.log(`=== FINAL SIMPLIFIED PRODUCTS (${products.length}) ===`);
  products.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Search: ${product.searchTerm}`);
    console.log(`   URL: ${product.amazonUrl}`);
  });
  
  return products.slice(0, 2);
};

const extractTargetPhrase = (suggestion: string): string | null => {
  console.log('Extracting target phrase from:', suggestion);
  
  // Pattern to find 1-4 words following the trigger verbs
  const pattern = /(?:add|wear|try|incorporate|consider)\s+(?:a|an|some)?\s*([a-zA-Z]+(?:\s+[a-zA-Z]+){0,3})/gi;
  
  let match;
  const matches: string[] = [];
  
  while ((match = pattern.exec(suggestion)) !== null) {
    const phrase = match[1].trim();
    if (phrase && phrase.length > 0) {
      matches.push(phrase);
      console.log('Found potential phrase:', phrase);
    }
  }
  
  // Return the first valid match
  if (matches.length > 0) {
    const selectedPhrase = matches[0];
    console.log('Selected phrase:', selectedPhrase);
    return selectedPhrase;
  }
  
  console.log('No phrase extracted');
  return null;
};

const buildProduct = (phrase: string, suggestion: string, gender: Gender): SimplifiedProduct => {
  // Build UI label
  const name = `Style Enhancement: ${capitalizePhrase(phrase)}`;
  
  // Build search term
  const genderPrefix = gender === 'male' ? 'mens' : 'womens';
  const searchTerm = `${genderPrefix} ${phrase}`;
  
  // Build Amazon URL
  const query = searchTerm.toLowerCase().replace(/\s+/g, '+');
  const amazonUrl = `https://www.amazon.co.uk/s?k=${query}&tag=ratemyfit-21`;
  
  // Extract context from suggestion
  const context = extractContext(suggestion, phrase);
  
  return {
    name,
    context,
    searchTerm,
    amazonUrl
  };
};

const capitalizePhrase = (phrase: string): string => {
  return phrase
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const extractContext = (suggestion: string, phrase: string): string => {
  // Extract a relevant context snippet from the suggestion
  const lowerSuggestion = suggestion.toLowerCase();
  
  if (lowerSuggestion.includes('professional') || lowerSuggestion.includes('work')) {
    return `This ${phrase} will add professional polish to your outfit.`;
  }
  if (lowerSuggestion.includes('casual') || lowerSuggestion.includes('relaxed')) {
    return `This ${phrase} brings casual sophistication to your look.`;
  }
  if (lowerSuggestion.includes('elevate') || lowerSuggestion.includes('polish')) {
    return `This ${phrase} will elevate your overall style.`;
  }
  if (lowerSuggestion.includes('color') || lowerSuggestion.includes('complement')) {
    return `This ${phrase} will improve your outfit's color coordination.`;
  }
  if (lowerSuggestion.includes('structure') || lowerSuggestion.includes('shape')) {
    return `This ${phrase} adds structure and improves your silhouette.`;
  }
  
  return `This ${phrase} will enhance your personal style.`;
};
