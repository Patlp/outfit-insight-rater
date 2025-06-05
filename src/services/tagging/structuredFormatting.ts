
import { AIClothingItem } from '@/services/clothingExtractionService';

export const applyStructuredFormat = async (items: AIClothingItem[], fullText: string): Promise<AIClothingItem[]> => {
  console.log('Applying structured format: MAX 3 WORDS - Clothing Item + Primary Descriptor');
  
  // Define core clothing items (nouns)
  const clothingNouns = [
    'shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'hoodie', 't-shirt', 'tee', 'polo', 'vest', 'coat', 'turtleneck', 'tank', 'camisole',
    'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'chinos', 'slacks',
    'dress', 'gown', 'sundress', 'maxi', 'midi',
    'shoes', 'sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers', 'oxfords', 'pumps',
    'belt', 'bag', 'purse', 'backpack', 'hat', 'cap', 'scarf', 'socks', 'jewelry', 'necklace', 'bracelet', 'earrings', 'watch', 'sunglasses'
  ];

  // Define descriptive words by category
  const colorWords = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'grey', 'navy', 'beige', 'cream', 'tan', 'olive', 'maroon', 'teal', 'coral', 'burgundy', 'khaki', 'mint', 'lavender', 'gold', 'silver', 'orange', 'light', 'dark'];
  const materialWords = ['cotton', 'denim', 'leather', 'silk', 'wool', 'linen', 'cashmere', 'velvet', 'satin', 'chiffon', 'suede', 'mesh', 'lace', 'polyester', 'nylon', 'spandex', 'jersey', 'fleece', 'canvas'];
  const patternWords = ['striped', 'plaid', 'checkered', 'polka', 'floral', 'geometric', 'abstract', 'solid', 'paisley', 'leopard', 'zebra', 'camouflage', 'tie-dye', 'ombre', 'houndstooth', 'tartan', 'gingham', 'ripped', 'distressed', 'fitted', 'oversized', 'cropped'];
  
  const words = fullText.toLowerCase().split(/\s+/);
  
  return items.map(item => {
    const itemWords = item.name.toLowerCase().split(/\s+/);
    
    // Find the core clothing noun
    const coreNoun = findCoreClothingNoun(itemWords, clothingNouns);
    if (!coreNoun) {
      console.log(`❌ No valid clothing noun found in: "${item.name}"`);
      return null;
    }
    
    // Extract the most relevant descriptor from context
    const primaryDescriptor = extractPrimaryDescriptor(words, itemWords, colorWords, materialWords, patternWords);
    
    // Build the 3-word max tag: [Descriptor] + [Clothing Noun]
    let structuredName = '';
    if (primaryDescriptor) {
      structuredName = `${capitalizeWord(primaryDescriptor)} ${capitalizeWord(coreNoun)}`;
    } else {
      structuredName = capitalizeWord(coreNoun);
    }
    
    // Ensure we don't exceed 3 words
    const nameWords = structuredName.split(' ');
    if (nameWords.length > 3) {
      structuredName = nameWords.slice(0, 3).join(' ');
    }
    
    console.log(`✅ Structured tag: "${item.name}" → "${structuredName}"`);
    
    return {
      ...item,
      name: structuredName,
      descriptors: primaryDescriptor ? [primaryDescriptor] : [],
      confidence: item.confidence + (primaryDescriptor ? 0.1 : 0)
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

export const extractPrimaryDescriptor = (
  allWords: string[], 
  itemWords: string[], 
  colorWords: string[], 
  materialWords: string[], 
  patternWords: string[]
): string | null => {
  // Priority: Color > Pattern > Material
  
  // Check for colors first (highest priority)
  const color = extractFromContext(allWords, itemWords, colorWords);
  if (color) return color;
  
  // Check for patterns second
  const pattern = extractFromContext(allWords, itemWords, patternWords);
  if (pattern) return pattern;
  
  // Check for materials last
  const material = extractFromContext(allWords, itemWords, materialWords);
  if (material) return material;
  
  return null;
};

export const extractFromContext = (allWords: string[], itemWords: string[], targetWords: string[]): string | null => {
  // Look for target words near the item words
  const itemIndices = itemWords.map(word => 
    allWords.findIndex(w => w.includes(word) || word.includes(w))
  ).filter(i => i !== -1);
  
  if (itemIndices.length === 0) return null;
  
  // Search within 3 words before and after item mentions
  for (const index of itemIndices) {
    for (let i = Math.max(0, index - 3); i <= Math.min(allWords.length - 1, index + 3); i++) {
      const word = allWords[i];
      const found = targetWords.find(target => word.includes(target) || target.includes(word));
      if (found) return found;
    }
  }
  
  return null;
};

export const capitalizeWord = (word: string): string => {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};
