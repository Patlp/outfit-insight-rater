
import { AIClothingItem } from '@/services/clothingExtractionService';
import { categorizeClothingItem } from '@/utils/clothingExtractor';

export const filterIndividualClothingItems = (items: AIClothingItem[]): AIClothingItem[] => {
  console.log('=== FILTERING FOR INDIVIDUAL CLOTHING ITEMS ===');
  
  const filteredItems: AIClothingItem[] = [];
  
  // Words that indicate combinations or styling rather than individual items
  const combinationWords = ['and', 'with', 'of', 'layering', 'combination', 'pairing', 'styling', 'mix', 'ensemble'];
  const stylingTerms = ['layering', 'coordination', 'styling', 'outfit', 'look', 'ensemble', 'pairing'];
  
  // Valid single clothing items from our whitelist structure
  const validClothingItems = [
    'shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'hoodie', 't-shirt', 'tee', 'polo', 'vest', 'coat', 'turtleneck', 'tank', 'camisole',
    'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'chinos', 'slacks',
    'dress', 'gown', 'sundress', 'maxi', 'midi',
    'shoes', 'sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers', 'oxfords', 'pumps',
    'belt', 'bag', 'purse', 'backpack', 'hat', 'cap', 'scarf', 'socks', 'jewelry', 'necklace', 'bracelet', 'earrings', 'watch', 'sunglasses'
  ];

  for (const item of items) {
    const itemName = item.name.toLowerCase();
    
    // Check if this is a combination tag (contains "and", "with", etc.)
    const isCombination = combinationWords.some(word => itemName.includes(` ${word} `));
    
    // Check if this is a styling description rather than a clothing item
    const isStylingTerm = stylingTerms.some(term => itemName.includes(term));
    
    // Check if it contains a valid clothing item
    const containsValidItem = validClothingItems.some(clothing => itemName.includes(clothing));
    
    if (isCombination) {
      console.log(`❌ Rejecting combination tag: "${item.name}"`);
      
      // Try to split combination into individual items
      const splitItems = splitCombinationTag(item);
      filteredItems.push(...splitItems);
      continue;
    }
    
    if (isStylingTerm && !containsValidItem) {
      console.log(`❌ Rejecting styling term: "${item.name}"`);
      continue;
    }
    
    if (!containsValidItem) {
      console.log(`❌ Rejecting non-clothing item: "${item.name}"`);
      continue;
    }
    
    // Clean the item name to ensure it follows the structure
    const cleanedItem = cleanIndividualItemName(item);
    console.log(`✅ Accepting individual item: "${cleanedItem.name}"`);
    filteredItems.push(cleanedItem);
  }
  
  console.log(`Filtered ${items.length} items down to ${filteredItems.length} individual clothing items`);
  return filteredItems;
};

export const splitCombinationTag = (combinationItem: AIClothingItem): AIClothingItem[] => {
  const itemName = combinationItem.name.toLowerCase();
  const splitItems: AIClothingItem[] = [];
  
  // Common patterns to split
  const patterns = [
    /(.+?)\s+and\s+(.+)/,
    /(.+?)\s+with\s+(.+)/,
    /(.+?)\s+&\s+(.+)/
  ];
  
  for (const pattern of patterns) {
    const match = itemName.match(pattern);
    if (match) {
      const [, item1, item2] = match;
      
      // Create individual items
      const cleanItem1 = createIndividualItem(item1.trim(), combinationItem);
      const cleanItem2 = createIndividualItem(item2.trim(), combinationItem);
      
      if (cleanItem1) splitItems.push(cleanItem1);
      if (cleanItem2) splitItems.push(cleanItem2);
      
      console.log(`🔄 Split "${combinationItem.name}" into: "${cleanItem1?.name}" and "${cleanItem2?.name}"`);
      break;
    }
  }
  
  return splitItems;
};

export const createIndividualItem = (itemText: string, originalItem: AIClothingItem): AIClothingItem | null => {
  // Clean up the item text
  const cleaned = itemText
    .replace(/^(the|a|an)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleaned.length < 3) return null;
  
  // Capitalize properly
  const capitalizedName = cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    name: capitalizedName,
    descriptors: originalItem.descriptors,
    category: categorizeClothingItem(cleaned),
    confidence: originalItem.confidence * 0.9, // Slightly lower confidence for split items
    source: originalItem.source
  };
};

export const cleanIndividualItemName = (item: AIClothingItem): AIClothingItem => {
  let cleanName = item.name;
  
  // Remove common prefixes that don't add value
  cleanName = cleanName.replace(/^(the|a|an)\s+/i, '');
  
  // Remove styling words
  cleanName = cleanName.replace(/\b(layering|styling|combination|pairing|mix)\s+(of\s+)?/gi, '');
  
  // Clean up spacing
  cleanName = cleanName.replace(/\s+/g, ' ').trim();
  
  // Ensure proper capitalization
  cleanName = cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return {
    ...item,
    name: cleanName
  };
};

export const removeDuplicates = (items: AIClothingItem[]): AIClothingItem[] => {
  const seen = new Set<string>();
  const unique: AIClothingItem[] = [];
  
  for (const item of items) {
    const key = item.name.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    } else {
      // If we've seen this item, maybe boost the confidence of the existing one
      const existingIndex = unique.findIndex(u => u.name.toLowerCase().replace(/\s+/g, ' ').trim() === key);
      if (existingIndex !== -1) {
        unique[existingIndex].confidence = Math.min(0.98, unique[existingIndex].confidence + 0.05);
      }
    }
  }
  
  return unique;
};
