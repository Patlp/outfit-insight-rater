
import { AIClothingItem } from '@/services/clothingExtractionService';

export const applyStructuredFormat = async (items: AIClothingItem[], fullText: string): Promise<AIClothingItem[]> => {
  console.log('Applying STRICT structured format: [Primary Descriptor] + [Clothing Item] - NO PREPOSITIONS');
  
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

  // Comprehensive color words - more specific and accurate
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
    
    // Extract the most relevant descriptor with enhanced color detection
    const primaryDescriptor = extractPrimaryDescriptorEnhanced(words, itemWords, colorWords, materialWords, patternWords, coreNoun);
    
    // Validate that no forbidden words are included
    if (primaryDescriptor && forbiddenWords.some(forbidden => primaryDescriptor.includes(forbidden))) {
      console.log(`❌ Forbidden word detected in descriptor: "${primaryDescriptor}"`);
      return null;
    }
    
    // Build the structured tag: [Primary Descriptor] + [Clothing Noun]
    let structuredName = '';
    if (primaryDescriptor) {
      structuredName = `${capitalizeWord(primaryDescriptor)} ${capitalizeWord(coreNoun)}`;
    } else {
      structuredName = capitalizeWord(coreNoun);
    }
    
    // Final validation: ensure no forbidden words in final name
    const finalWords = structuredName.toLowerCase().split(' ');
    if (finalWords.some(word => forbiddenWords.includes(word))) {
      console.log(`❌ Forbidden word in final tag: "${structuredName}"`);
      return null;
    }
    
    // Ensure exactly 2 words max (descriptor + item)
    const nameWords = structuredName.split(' ');
    if (nameWords.length > 2) {
      structuredName = nameWords.slice(-2).join(' '); // Take last 2 words (descriptor + noun)
    }
    
    console.log(`✅ Structured tag: "${item.name}" → "${structuredName}"`);
    
    return {
      ...item,
      name: structuredName,
      descriptors: primaryDescriptor ? [primaryDescriptor] : [],
      confidence: item.confidence + (primaryDescriptor ? 0.05 : 0)
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
  coreNoun: string
): string | null => {
  console.log(`Extracting primary descriptor for: ${coreNoun}`);
  
  // Enhanced color detection - look for colors specifically near this clothing item
  const color = extractFromContextEnhanced(allWords, itemWords, colorWords, coreNoun);
  if (color) {
    console.log(`✅ Found primary color: ${color} for ${coreNoun}`);
    return color;
  }
  
  // Check for patterns second
  const pattern = extractFromContextEnhanced(allWords, itemWords, patternWords, coreNoun);
  if (pattern) {
    console.log(`✅ Found pattern: ${pattern} for ${coreNoun}`);
    return pattern;
  }
  
  // Check for materials last
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
