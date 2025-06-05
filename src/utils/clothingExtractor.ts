
// Advanced clothing item extraction utility for wardrobe tagging

interface ClothingItem {
  name: string;
  category: string;
  descriptors: string[];
}

const CLOTHING_CATEGORIES = {
  tops: ['shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'hoodie', 't-shirt', 'polo', 'vest', 'coat', 'turtleneck', 'tank', 'camisole'],
  bottoms: ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'chinos', 'slacks'],
  dresses: ['dress', 'gown', 'sundress', 'maxi', 'midi'],
  footwear: ['shoes', 'sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers', 'oxfords', 'pumps'],
  accessories: ['belt', 'bag', 'purse', 'backpack', 'hat', 'scarf', 'jewelry', 'necklace', 'bracelet', 'earrings', 'watch', 'sunglasses'],
  outerwear: ['coat', 'jacket', 'blazer', 'cardigan', 'vest', 'hoodie', 'parka', 'trench']
};

const DESCRIPTIVE_ADJECTIVES = [
  // Colors
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey', 'brown', 'navy', 'beige', 'cream', 'tan', 'olive', 'maroon', 'teal', 'coral', 'burgundy', 'khaki', 'mint', 'lavender',
  // Patterns
  'striped', 'plaid', 'checkered', 'polka dot', 'floral', 'geometric', 'abstract', 'solid', 'paisley', 'leopard', 'zebra', 'camouflage', 'tie-dye', 'ombre',
  // Styles
  'casual', 'formal', 'business', 'vintage', 'modern', 'classic', 'trendy', 'bohemian', 'minimalist', 'edgy', 'preppy', 'athletic', 'elegant', 'chic',
  // Materials/Textures
  'leather', 'denim', 'cotton', 'silk', 'wool', 'linen', 'cashmere', 'velvet', 'satin', 'chiffon', 'suede', 'mesh', 'lace',
  // Fits/Styles
  'fitted', 'loose', 'oversized', 'slim', 'relaxed', 'tailored', 'cropped', 'high-waisted', 'low-rise', 'skinny', 'wide-leg', 'bootcut', 'straight',
  // Descriptors
  'graphic', 'embellished', 'sequined', 'ruffled', 'pleated', 'wrap', 'button-down', 'v-neck', 'crew neck', 'off-shoulder', 'strapless', 'long-sleeve', 'short-sleeve', 'sleeveless'
];

export const extractClothingItems = (feedbackText: string): string[] => {
  if (!feedbackText) return [];

  const extractedItems = new Set<string>();
  const text = feedbackText.toLowerCase();

  // Advanced pattern matching for clothing items with descriptors
  const patterns = [
    // Pattern: "adjective + clothing item" (e.g., "graphic tee", "plaid shirt")
    /\b([a-z-]+(?:\s+[a-z-]+)*)\s+(shirt|blouse|top|sweater|cardigan|jacket|blazer|hoodie|t-shirt|tee|polo|vest|coat|pants|jeans|trousers|shorts|skirt|dress|shoes|sneakers|heels|boots|sandals|flats|belt|bag|hat|scarf)\b/g,
    
    // Pattern: "clothing item with adjective" (e.g., "shirt with stripes")
    /\b(shirt|blouse|top|sweater|cardigan|jacket|blazer|hoodie|t-shirt|tee|polo|vest|coat|pants|jeans|trousers|shorts|skirt|dress|shoes|sneakers|heels|boots|sandals|flats|belt|bag|hat|scarf)\s+(?:with|in|featuring)\s+([a-z-]+(?:\s+[a-z-]+)*)\b/g,
    
    // Pattern: "color + clothing item" (e.g., "red dress", "navy blazer")
    /\b(red|blue|green|yellow|orange|purple|pink|black|white|gray|grey|brown|navy|beige|cream|tan|olive|maroon|teal|coral|burgundy|khaki)\s+(shirt|blouse|top|sweater|cardigan|jacket|blazer|hoodie|t-shirt|tee|polo|vest|coat|pants|jeans|trousers|shorts|skirt|dress|shoes|sneakers|heels|boots|sandals|flats|belt|bag|hat|scarf)\b/g,
    
    // Pattern: compound clothing items (e.g., "midi skirt", "crop top")
    /\b(midi|maxi|mini|crop|high-waisted|low-rise|wide-leg|skinny|straight|bootcut|slim|fitted|oversized|long-sleeve|short-sleeve|sleeveless|off-shoulder|v-neck|crew neck|button-down|wrap)\s+(skirt|dress|top|shirt|pants|jeans|shorts|jacket|blazer)\b/g
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const fullMatch = match[0];
      // Clean up the match
      const cleanMatch = fullMatch
        .replace(/\b(the|a|an|this|that|your|my)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanMatch.length > 2) {
        extractedItems.add(cleanMatch);
      }
    }
  });

  // Also extract standalone clothing items that might be mentioned
  Object.values(CLOTHING_CATEGORIES).flat().forEach(item => {
    const itemRegex = new RegExp(`\\b${item}s?\\b`, 'gi');
    if (itemRegex.test(text)) {
      // Try to find if it's mentioned with descriptors nearby
      const contextRegex = new RegExp(`\\b([a-z-]+(?:\\s+[a-z-]+)*)\\s+${item}s?\\b|\\b${item}s?\\s+(?:with|in|featuring)\\s+([a-z-]+(?:\\s+[a-z-]+)*)\\b`, 'gi');
      let contextMatch;
      while ((contextMatch = contextRegex.exec(text)) !== null) {
        const descriptor = contextMatch[1] || contextMatch[2];
        if (descriptor && DESCRIPTIVE_ADJECTIVES.some(adj => descriptor.includes(adj))) {
          extractedItems.add(`${descriptor} ${item}`.trim());
        }
      }
      
      // If no context found, add the basic item
      if (![...extractedItems].some(existing => existing.includes(item))) {
        extractedItems.add(item);
      }
    }
  });

  // Convert to array and clean up
  let results = Array.from(extractedItems)
    .filter(item => 
      item.length > 2 && 
      !item.match(/^\s*$/) &&
      // Filter out items that are just adjectives
      Object.values(CLOTHING_CATEGORIES).flat().some(clothing => item.includes(clothing))
    )
    .map(item => {
      // Capitalize first letter of each word
      return item.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    })
    .slice(0, 6); // Limit to 6 items to avoid clutter

  // Remove duplicates and very similar items
  results = results.filter((item, index) => {
    return !results.slice(0, index).some(existing => 
      existing.toLowerCase().includes(item.toLowerCase()) || 
      item.toLowerCase().includes(existing.toLowerCase())
    );
  });

  return results.slice(0, 4); // Final limit to 4 most relevant items
};

export const categorizeClothingItem = (item: string): string => {
  const lowerItem = item.toLowerCase();
  
  for (const [category, items] of Object.entries(CLOTHING_CATEGORIES)) {
    if (items.some(clothing => lowerItem.includes(clothing))) {
      return category;
    }
  }
  
  return 'other';
};
