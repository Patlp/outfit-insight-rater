import { AIClothingItem } from '@/services/clothingExtractionService';

export const applyStructuredFormat = async (items: AIClothingItem[], fullText: string): Promise<AIClothingItem[]> => {
  console.log('Applying structured format: Colour + Clothing Item + Material + Pattern');
  
  // Define extraction patterns
  const colorWords = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'grey', 'navy', 'beige', 'cream', 'tan', 'olive', 'maroon', 'teal', 'coral', 'burgundy', 'khaki', 'mint', 'lavender', 'gold', 'silver', 'orange'];
  const materialWords = ['cotton', 'denim', 'leather', 'silk', 'wool', 'linen', 'cashmere', 'velvet', 'satin', 'chiffon', 'suede', 'mesh', 'lace', 'polyester', 'nylon', 'spandex', 'jersey', 'fleece', 'canvas'];
  const patternWords = ['striped', 'plaid', 'checkered', 'polka dot', 'floral', 'geometric', 'abstract', 'solid', 'paisley', 'leopard', 'zebra', 'camouflage', 'tie-dye', 'ombre', 'houndstooth', 'tartan', 'gingham'];
  
  const words = fullText.toLowerCase().split(/\s+/);
  
  return items.map(item => {
    const itemWords = item.name.toLowerCase().split(/\s+/);
    
    // Extract components from text context
    const extractedColor = extractFromContext(words, itemWords, colorWords);
    const extractedMaterial = extractFromContext(words, itemWords, materialWords);
    const extractedPattern = extractFromContext(words, itemWords, patternWords);
    
    // Get existing descriptors
    const existingDescriptors = item.descriptors || [];
    
    // Build structured name following: Colour + Clothing Item + Material + Pattern
    const components = [];
    
    // Add color if found
    if (extractedColor) {
      components.push(extractedColor);
    }
    
    // Add the core clothing item (clean it up)
    const coreItem = extractCoreClothingItem(item.name);
    components.push(coreItem);
    
    // Add material if found
    if (extractedMaterial) {
      components.push(extractedMaterial);
    }
    
    // Add pattern if found
    if (extractedPattern) {
      components.push(extractedPattern);
    }
    
    const structuredName = components.join(' ');
    
    // Combine all descriptors
    const allDescriptors = [
      ...existingDescriptors,
      ...(extractedColor ? [extractedColor] : []),
      ...(extractedMaterial ? [extractedMaterial] : []),
      ...(extractedPattern ? [extractedPattern] : [])
    ].filter((desc, index, arr) => arr.indexOf(desc) === index); // Remove duplicates
    
    return {
      ...item,
      name: structuredName,
      descriptors: allDescriptors,
      confidence: item.confidence + (components.length > 2 ? 0.1 : 0) // Boost confidence for more complete descriptions
    };
  });
};

export const extractFromContext = (allWords: string[], itemWords: string[], targetWords: string[]): string | null => {
  // Look for target words near the item words
  const itemIndices = itemWords.map(word => allWords.findIndex(w => w.includes(word) || word.includes(w))).filter(i => i !== -1);
  
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

export const extractCoreClothingItem = (itemName: string): string => {
  // Remove common descriptors to get the core clothing item
  const words = itemName.toLowerCase().split(/\s+/);
  const coreWords = words.filter(word => {
    // Keep words that are likely core clothing items
    return !['black', 'white', 'blue', 'red', 'green', 'cotton', 'leather', 'striped', 'solid'].includes(word) && word.length > 2;
  });
  
  return coreWords.length > 0 ? coreWords.join(' ') : itemName;
};
