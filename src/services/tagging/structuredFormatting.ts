

import { AIClothingItem } from '@/services/clothingExtractionService';
import { StyleReference, validateAgainstStyle } from './styleParser';

export const applyStructuredFormat = async (
  items: AIClothingItem[], 
  fullText: string,
  styleReferences: StyleReference[] = []
): Promise<AIClothingItem[]> => {
  console.log('=== APPLYING STRICT 2-WORD STRUCTURED FORMAT ===');
  console.log('ENFORCING: [Color/Descriptor] + [Clothing Item] - NO PREPOSITIONS - MAX 2 WORDS');
  
  // Define core clothing items (nouns) - expanded and more precise
  const clothingNouns = [
    // Tops
    'shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'hoodie', 't-shirt', 'tee', 'polo', 'vest', 'coat', 'turtleneck', 'tank', 'camisole',
    // Bottoms
    'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'chinos', 'slacks',
    // Dresses
    'dress', 'gown', 'sundress', 'maxi', 'midi',
    // Footwear
    'shoes', 'sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers', 'oxfords', 'pumps',
    // Accessories
    'belt', 'bag', 'purse', 'backpack', 'hat', 'cap', 'scarf', 'socks', 'jewelry', 'necklace', 'bracelet', 'earrings', 'watch', 'sunglasses'
  ];

  // Enhanced color words with better matching
  const colorWords = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey', 'brown', 'navy', 'beige', 'cream', 'tan', 'olive', 'maroon', 'teal', 'coral', 'burgundy', 'khaki', 'mint', 'lavender', 'gold', 'silver', 'light', 'dark',
    // Extended colors
    'crimson', 'scarlet', 'azure', 'turquoise', 'emerald', 'lime', 'amber', 'ivory', 'charcoal', 'slate', 'plum', 'magenta', 'cyan', 'indigo', 'violet', 'rose', 'peach', 'mustard', 'rust', 'sage'
  ];
  
  const materialWords = ['cotton', 'denim', 'leather', 'silk', 'wool', 'linen', 'cashmere', 'velvet', 'satin', 'chiffon', 'suede', 'mesh', 'lace', 'polyester', 'nylon', 'spandex', 'jersey', 'fleece', 'canvas'];
  const patternWords = ['striped', 'plaid', 'checkered', 'polka', 'floral', 'geometric', 'abstract', 'solid', 'paisley', 'leopard', 'zebra', 'camouflage', 'tie-dye', 'ombre', 'houndstooth', 'tartan', 'gingham', 'ripped', 'distressed', 'fitted', 'oversized', 'cropped'];
  
  // Forbidden words that should NEVER appear in tags
  const forbiddenWords = ['of', 'with', 'and', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'from', 'by', 'against', 'choice', 'pairing', 'providing', 'contrast', 'complements', 'tones'];
  
  const words = fullText.toLowerCase().split(/\s+/);
  
  return items.map(item => {
    const itemWords = item.name.toLowerCase().split(/\s+/);
    
    // Find the core clothing noun
    const coreNoun = findCoreClothingNoun(itemWords, clothingNouns);
    if (!coreNoun) {
      console.log(`❌ No valid clothing noun found in: "${item.name}"`);
      return null;
    }
    
    // Extract the most relevant descriptor with enhanced matching against Style section
    const primaryDescriptor = extractPrimaryDescriptorEnhanced(
      words, 
      itemWords, 
      colorWords, 
      materialWords, 
      patternWords, 
      coreNoun,
      styleReferences
    );
    
    // Validate that no forbidden words are included
    if (primaryDescriptor && forbiddenWords.some(forbidden => primaryDescriptor.includes(forbidden))) {
      console.log(`❌ Forbidden word detected in descriptor: "${primaryDescriptor}"`);
      return null;
    }
    
    // Build the structured tag: EXACTLY 2 words: [Primary Descriptor] + [Clothing Noun]
    let structuredName = '';
    if (primaryDescriptor) {
      structuredName = `${capitalizeWord(primaryDescriptor)} ${capitalizeWord(coreNoun)}`;
    } else {
      // If no descriptor found, use just the clothing item (1 word)
      structuredName = capitalizeWord(coreNoun);
    }
    
    // STRICT VALIDATION: Final check for word count and forbidden words
    const finalWords = structuredName.toLowerCase().split(' ');
    if (finalWords.length > 2) {
      console.log(`❌ Exceeds 2-word limit: "${structuredName}" (${finalWords.length} words)`);
      return null;
    }
    
    if (finalWords.some(word => forbiddenWords.includes(word))) {
      console.log(`❌ Forbidden word in final tag: "${structuredName}"`);
      return null;
    }
    
    // Apply Style section confidence boost
    const styleConfidence = validateAgainstStyle(structuredName, styleReferences);
    const boostedConfidence = Math.min(0.98, (item.confidence || 0.7) * styleConfidence);
    
    console.log(`✅ Structured tag: "${item.name}" → "${structuredName}" (confidence: ${boostedConfidence.toFixed(2)})`);
    
    return {
      ...item,
      name: structuredName,
      descriptors: primaryDescriptor ? [primaryDescriptor] : [],
      confidence: boostedConfidence
    };
  }).filter(item => item !== null) as AIClothingItem[];
};

export const findCoreClothingNoun = (itemWords: string[], clothingNouns: string[]): string | null => {
  // Look for exact matches first
  for (const word of itemWords) {
    if (clothingNouns.includes(word)) {
      return word;
    }
  }
  
  // Look for partial matches
  for (const word of itemWords) {
    const found = clothingNouns.find(noun => 
      word.includes(noun) || noun.includes(word)
    );
    if (found) return found;
  }
  
  return null;
};

export const extractPrimaryDescriptorEnhanced = (
  allWords: string[], 
  itemWords: string[], 
  colorWords: string[], 
  materialWords: string[], 
  patternWords: string[],
  coreNoun: string,
  styleReferences: StyleReference[] = []
): string | null => {
  console.log(`Extracting primary descriptor for: ${coreNoun}`);
  
  // PRIORITY 1: Check Style section references first
  for (const styleRef of styleReferences) {
    if (styleRef.item === coreNoun && styleRef.descriptors.length > 0) {
      const styleDescriptor = styleRef.descriptors[0]; // Use first descriptor from style
      console.log(`✅ Found STYLE descriptor: ${styleDescriptor} for ${coreNoun}`);
      return styleDescriptor;
    }
  }
  
  // PRIORITY 2: Enhanced color detection - look for colors specifically near this clothing item
  const color = extractFromContextEnhanced(allWords, itemWords, colorWords, coreNoun);
  if (color) {
    console.log(`✅ Found primary color: ${color} for ${coreNoun}`);
    return color;
  }
  
  // PRIORITY 3: Check for patterns
  const pattern = extractFromContextEnhanced(allWords, itemWords, patternWords, coreNoun);
  if (pattern) {
    console.log(`✅ Found pattern: ${pattern} for ${coreNoun}`);
    return pattern;
  }
  
  // PRIORITY 4: Check for materials last
  const material = extractFromContextEnhanced(allWords, itemWords, materialWords, coreNoun);
  if (material) {
    console.log(`✅ Found material: ${material} for ${coreNoun}`);
    return material;
  }
  
  console.log(`❌ No primary descriptor found for: ${coreNoun}`);
  return null;
};

export const extractFromContextEnhanced = (
  allWords: string[], 
  itemWords: string[], 
  targetWords: string[], 
  coreNoun: string
): string | null => {
  // Find all mentions of this specific clothing item
  const itemIndices: number[] = [];
  
  allWords.forEach((word, index) => {
    if (word.includes(coreNoun) || coreNoun.includes(word)) {
      itemIndices.push(index);
    }
  });
  
  if (itemIndices.length === 0) {
    // Fallback: look for any item word mentions
    itemWords.forEach(itemWord => {
      allWords.forEach((word, index) => {
        if (word.includes(itemWord) || itemWord.includes(word)) {
          itemIndices.push(index);
        }
      });
    });
  }
  
  if (itemIndices.length === 0) return null;
  
  // Search within 4 words before and 2 words after item mentions for better accuracy
  for (const index of itemIndices) {
    // Prioritize words immediately before the item (typical English structure)
    for (let i = Math.max(0, index - 4); i < index; i++) {
      const word = allWords[i];
      const found = targetWords.find(target => {
        const wordLower = word.toLowerCase();
        const targetLower = target.toLowerCase();
        return wordLower === targetLower || wordLower.includes(targetLower) || targetLower.includes(wordLower);
      });
      if (found) {
        console.log(`Found descriptor "${found}" at position ${i} before item "${coreNoun}" at position ${index}`);
        return found;
      }
    }
    
    // Then check words after the item
    for (let i = index + 1; i <= Math.min(allWords.length - 1, index + 2); i++) {
      const word = allWords[i];
      const found = targetWords.find(target => {
        const wordLower = word.toLowerCase();
        const targetLower = target.toLowerCase();
        return wordLower === targetLower || wordLower.includes(targetLower) || targetLower.includes(wordLower);
      });
      if (found) {
        console.log(`Found descriptor "${found}" at position ${i} after item "${coreNoun}" at position ${index}`);
        return found;
      }
    }
  }
  
  return null;
};

export const capitalizeWord = (word: string): string => {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

