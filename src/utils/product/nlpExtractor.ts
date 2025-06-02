
import { Gender } from '@/context/RatingContext';

export interface ExtractedProduct {
  name: string;
  context: string;
  searchTerm: string;
  amazonUrl: string;
}

const TRIGGER_VERBS = ['add', 'wear', 'try', 'incorporate', 'consider', 'include'];

export const extractProductsWithNLP = (
  suggestions: string[], 
  gender: Gender
): ExtractedProduct[] => {
  console.log('=== NLP PRODUCT EXTRACTION ===');
  console.log('Suggestions:', suggestions);
  console.log('Gender:', gender);
  
  const products: ExtractedProduct[] = [];
  
  suggestions.forEach((suggestion, index) => {
    console.log(`Processing suggestion ${index + 1}: "${suggestion}"`);
    
    if (products.length < 2) {
      const extractedPhrase = extractFashionPhrase(suggestion);
      
      if (extractedPhrase) {
        // Check for duplicates
        const isDuplicate = products.some(p => 
          p.searchTerm.toLowerCase().includes(extractedPhrase.toLowerCase()) ||
          extractedPhrase.toLowerCase().includes(p.searchTerm.toLowerCase())
        );
        
        if (!isDuplicate) {
          const product = buildProductFromPhrase(extractedPhrase, suggestion, gender);
          products.push(product);
          console.log('Added product:', product);
        }
      }
    }
  });
  
  // Add fallback if we don't have enough products
  while (products.length < 2) {
    const fallbackProduct: ExtractedProduct = {
      name: "Style Enhancement: Top",
      context: "A versatile piece that will enhance your overall look.",
      searchTerm: `${gender === 'male' ? 'mens' : 'womens'} top`,
      amazonUrl: ""
    };
    products.push(fallbackProduct);
  }
  
  console.log(`=== FINAL NLP PRODUCTS (${products.length}) ===`);
  products.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Search: ${product.searchTerm}`);
    console.log(`   URL: ${product.amazonUrl}`);
  });
  
  return products.slice(0, 2);
};

const extractFashionPhrase = (suggestion: string): string | null => {
  console.log('Extracting fashion phrase from:', suggestion);
  
  // Clean and prepare the text
  const cleanText = suggestion.toLowerCase().replace(/[.,!?;]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleanText.split(' ');
  
  // Find trigger verb positions
  const triggerPositions: number[] = [];
  TRIGGER_VERBS.forEach(verb => {
    const index = words.indexOf(verb);
    if (index !== -1) {
      triggerPositions.push(index);
    }
  });
  
  if (triggerPositions.length === 0) {
    console.log('No trigger verbs found');
    return null;
  }
  
  // Process each trigger position
  for (const triggerIndex of triggerPositions) {
    const phrase = extractNounPhraseAfterVerb(words, triggerIndex);
    if (phrase) {
      console.log('Extracted phrase:', phrase);
      return phrase;
    }
  }
  
  console.log('No valid phrase found');
  return null;
};

const extractNounPhraseAfterVerb = (words: string[], verbIndex: number): string | null => {
  let startIndex = verbIndex + 1;
  
  // Skip articles (a, an, the, some)
  while (startIndex < words.length && ['a', 'an', 'the', 'some'].includes(words[startIndex])) {
    startIndex++;
  }
  
  if (startIndex >= words.length) {
    return null;
  }
  
  // Extract up to 4 words starting from the current position
  const candidates = words.slice(startIndex, startIndex + 4);
  
  // Use NLP-like logic to identify the best noun phrase
  const nounPhrase = identifyFashionNounPhrase(candidates);
  
  return nounPhrase;
};

const identifyFashionNounPhrase = (candidates: string[]): string | null => {
  if (candidates.length === 0) return null;
  
  // Fashion-specific words that are likely to be nouns
  const fashionNouns = [
    'coat', 'jacket', 'parka', 'blazer', 'cardigan', 'sweater', 'hoodie',
    'shirt', 'blouse', 'top', 'tee', 'tank', 'dress', 'skirt', 'pants', 
    'jeans', 'trousers', 'shorts', 'leggings', 'boots', 'shoes', 'sneakers',
    'heels', 'flats', 'sandals', 'scarf', 'beanie', 'hat', 'gloves', 'belt',
    'bag', 'purse', 'accessories', 'jewelry', 'necklace', 'earrings', 'watch',
    'sunglasses', 'tie', 'bow', 'vest', 'suit', 'tuxedo', 'gown', 'jumpsuit'
  ];
  
  // Adjectives that commonly describe fashion items
  const fashionAdjectives = [
    'warm', 'stylish', 'casual', 'formal', 'elegant', 'comfortable', 'fitted',
    'loose', 'tight', 'oversized', 'vintage', 'modern', 'classic', 'trendy',
    'insulated', 'waterproof', 'breathable', 'winter', 'summer', 'spring',
    'fall', 'dark', 'light', 'bright', 'neutral', 'colorful', 'plain',
    'patterned', 'striped', 'solid', 'denim', 'leather', 'cotton', 'wool'
  ];
  
  // Find the core noun(s) in the phrase
  const nounIndices: number[] = [];
  candidates.forEach((word, index) => {
    if (fashionNouns.includes(word)) {
      nounIndices.push(index);
    }
  });
  
  if (nounIndices.length === 0) {
    // If no fashion nouns found, try to identify by position (nouns typically come last)
    // Look for words that don't appear to be conjunctions or prepositions
    const nonFunctionWords = candidates.filter(word => 
      !['and', 'or', 'for', 'with', 'like', 'of', 'in', 'to', 'from'].includes(word)
    );
    
    if (nonFunctionWords.length > 0) {
      // Take the last few words as they're likely to be the main noun phrase
      return nonFunctionWords.slice(-2).join(' ');
    }
    
    return null;
  }
  
  // Build the phrase around the identified nouns
  const firstNounIndex = nounIndices[0];
  const lastNounIndex = nounIndices[nounIndices.length - 1];
  
  // Include adjectives before the first noun
  let startIndex = 0;
  for (let i = firstNounIndex - 1; i >= 0 && i >= firstNounIndex - 2; i--) {
    if (fashionAdjectives.includes(candidates[i]) || isLikelyAdjective(candidates[i])) {
      startIndex = i;
    } else {
      break;
    }
  }
  
  // Include all words from start to last noun, handling compound nouns and lists
  let endIndex = lastNounIndex;
  
  // Handle lists like "scarf, beanie, and gloves"
  if (lastNounIndex < candidates.length - 1) {
    const remaining = candidates.slice(lastNounIndex + 1);
    let listExtension = '';
    
    for (let i = 0; i < remaining.length; i++) {
      const word = remaining[i];
      if (word === 'and' || word === 'or') {
        // Check if the next word is a fashion noun
        if (i + 1 < remaining.length && fashionNouns.includes(remaining[i + 1])) {
          endIndex = lastNounIndex + i + 2;
        }
        break;
      } else if (fashionNouns.includes(word)) {
        endIndex = lastNounIndex + i + 1;
      } else if (word.endsWith(',')) {
        // Handle comma-separated lists
        const cleanWord = word.replace(',', '');
        if (fashionNouns.includes(cleanWord)) {
          endIndex = lastNounIndex + i + 1;
        }
      } else {
        break;
      }
    }
  }
  
  const extractedPhrase = candidates.slice(startIndex, endIndex + 1).join(' ');
  
  // Clean up the phrase
  const cleanedPhrase = extractedPhrase
    .replace(/,$/, '') // Remove trailing comma
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  return cleanedPhrase || null;
};

const isLikelyAdjective = (word: string): boolean => {
  // Simple heuristics for adjectives
  return word.endsWith('ed') || word.endsWith('ing') || word.endsWith('ly') || 
         word.endsWith('ful') || word.endsWith('less') || word.endsWith('ous') ||
         word.length <= 8; // Short descriptive words are often adjectives
};

const buildProductFromPhrase = (phrase: string, suggestion: string, gender: Gender): ExtractedProduct => {
  // Build UI label
  const name = `Style Enhancement: ${capitalizePhrase(phrase)}`;
  
  // Build search term
  const genderPrefix = gender === 'male' ? 'mens' : 'womens';
  const searchTerm = `${genderPrefix} ${phrase}`;
  
  // Build Amazon URL
  const query = searchTerm.toLowerCase().replace(/\s+/g, '+');
  const amazonUrl = `https://www.amazon.co.uk/s?k=${query}&tag=ratemyfit-21`;
  
  // Extract context from suggestion
  const context = extractContextFromSuggestion(suggestion, phrase);
  
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

const extractContextFromSuggestion = (suggestion: string, phrase: string): string => {
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
  if (lowerSuggestion.includes('warm') || lowerSuggestion.includes('winter') || lowerSuggestion.includes('cold')) {
    return `This ${phrase} will keep you warm and stylish.`;
  }
  
  return `This ${phrase} will enhance your personal style.`;
};
