
// Style section parser for cross-checking clothing items with feedback

export interface StyleReference {
  item: string;
  descriptors: string[];
  confidence: number;
  context: string;
}

export const extractItemsFromStyle = (feedback: string): StyleReference[] => {
  console.log('=== EXTRACTING ITEMS FROM STYLE SECTION ===');
  
  if (!feedback) {
    console.log('No feedback provided');
    return [];
  }

  // Extract the Style section specifically
  const styleMatch = feedback.match(/\*\*Style:\*\*\s*(.*?)(?=\*\*(?:Color Coordination|Fit|Overall Impression):|$)/gis);
  
  if (!styleMatch || !styleMatch[1]) {
    console.log('No Style section found in feedback');
    return [];
  }

  const styleText = styleMatch[1].trim();
  console.log('Style section text:', styleText);

  // Valid clothing items from our whitelist
  const validClothingNouns = [
    'shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'hoodie', 't-shirt', 'tee', 'polo', 'vest', 'coat', 'turtleneck', 'tank', 'camisole',
    'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'chinos', 'slacks',
    'dress', 'gown', 'sundress', 'maxi', 'midi',
    'shoes', 'sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers', 'oxfords', 'pumps',
    'belt', 'bag', 'purse', 'backpack', 'hat', 'cap', 'scarf', 'socks', 'jewelry', 'necklace', 'bracelet', 'earrings', 'watch', 'sunglasses'
  ];

  // Enhanced color and descriptor detection
  const colorWords = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey', 'brown', 'navy', 'beige', 'cream', 'tan', 'olive', 'maroon', 'teal', 'coral', 'burgundy', 'khaki', 'mint', 'lavender', 'gold', 'silver', 'light', 'dark',
    'crimson', 'scarlet', 'azure', 'turquoise', 'emerald', 'lime', 'amber', 'ivory', 'charcoal', 'slate', 'plum', 'magenta', 'cyan', 'indigo', 'violet', 'rose', 'peach', 'mustard', 'rust', 'sage'
  ];

  const materialWords = ['cotton', 'denim', 'leather', 'silk', 'wool', 'linen', 'cashmere', 'velvet', 'satin', 'chiffon', 'suede', 'mesh', 'lace', 'polyester', 'nylon', 'spandex', 'jersey', 'fleece', 'canvas'];
  const patternWords = ['striped', 'plaid', 'checkered', 'polka', 'floral', 'geometric', 'abstract', 'solid', 'paisley', 'leopard', 'zebra', 'camouflage', 'tie-dye', 'ombre', 'houndstooth', 'tartan', 'gingham', 'ripped', 'distressed', 'fitted', 'oversized', 'cropped'];

  const styleReferences: StyleReference[] = [];
  const words = styleText.toLowerCase().split(/\s+/);

  // Find clothing items mentioned in the Style section
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Check if this word or next few words contain a clothing item
    for (const clothingItem of validClothingNouns) {
      if (word.includes(clothingItem) || clothingItem.includes(word)) {
        // Found a clothing item, now look for descriptors nearby
        const descriptors: string[] = [];
        let confidence = 0.8; // Base confidence for Style section mentions
        
        // Look for descriptors in a 4-word window before and 2 words after
        const startIndex = Math.max(0, i - 4);
        const endIndex = Math.min(words.length - 1, i + 2);
        
        for (let j = startIndex; j <= endIndex; j++) {
          if (j === i) continue; // Skip the clothing item itself
          
          const contextWord = words[j];
          
          // Check for color words
          if (colorWords.some(color => contextWord.includes(color) || color.includes(contextWord))) {
            const matchedColor = colorWords.find(color => contextWord.includes(color) || color.includes(contextWord));
            if (matchedColor && !descriptors.includes(matchedColor)) {
              descriptors.push(matchedColor);
              confidence += 0.1; // Boost confidence for color match
            }
          }
          
          // Check for material words
          if (materialWords.some(material => contextWord.includes(material) || material.includes(contextWord))) {
            const matchedMaterial = materialWords.find(material => contextWord.includes(material) || material.includes(contextWord));
            if (matchedMaterial && !descriptors.includes(matchedMaterial)) {
              descriptors.push(matchedMaterial);
              confidence += 0.05;
            }
          }
          
          // Check for pattern words
          if (patternWords.some(pattern => contextWord.includes(pattern) || pattern.includes(contextWord))) {
            const matchedPattern = patternWords.find(pattern => contextWord.includes(pattern) || pattern.includes(contextWord));
            if (matchedPattern && !descriptors.includes(matchedPattern)) {
              descriptors.push(matchedPattern);
              confidence += 0.05;
            }
          }
        }

        // Extract context (sentence containing the item)
        const sentences = styleText.split(/[.!?]+/);
        const context = sentences.find(sentence => 
          sentence.toLowerCase().includes(clothingItem)
        ) || '';

        styleReferences.push({
          item: clothingItem,
          descriptors,
          confidence: Math.min(confidence, 0.98), // Cap at 98%
          context: context.trim()
        });

        console.log(`Found Style reference: ${clothingItem} with descriptors [${descriptors.join(', ')}] (confidence: ${confidence.toFixed(2)})`);
      }
    }
  }

  console.log(`=== STYLE SECTION EXTRACTION COMPLETE: ${styleReferences.length} items ===`);
  return styleReferences;
};

export const validateAgainstStyle = (itemName: string, styleReferences: StyleReference[]): number => {
  if (!styleReferences || styleReferences.length === 0) {
    return 0.5; // Neutral confidence if no style references
  }

  const lowerItemName = itemName.toLowerCase();
  
  // Check if any style reference matches this item
  for (const styleRef of styleReferences) {
    if (lowerItemName.includes(styleRef.item) || styleRef.item.includes(lowerItemName)) {
      console.log(`✅ Style validation: "${itemName}" matches style reference "${styleRef.item}" (confidence boost: +${styleRef.confidence.toFixed(2)})`);
      return styleRef.confidence;
    }
  }

  // Check if descriptors in the item name match style references
  const itemWords = lowerItemName.split(' ');
  for (const styleRef of styleReferences) {
    for (const descriptor of styleRef.descriptors) {
      if (itemWords.some(word => word.includes(descriptor) || descriptor.includes(word))) {
        console.log(`✅ Style validation: "${itemName}" has descriptor "${descriptor}" from style section (confidence boost: +0.3)`);
        return 0.8; // Good confidence for descriptor match
      }
    }
  }

  console.log(`❌ Style validation: "${itemName}" not found in style section (confidence penalty: -0.2)`);
  return 0.4; // Lower confidence if not mentioned in style
};
