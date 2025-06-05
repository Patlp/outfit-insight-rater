
import { AIClothingItem } from '@/services/clothingExtractionService';
import { categorizeClothingItem } from '@/utils/clothingExtractor';

export const filterIndividualClothingItems = (items: AIClothingItem[]): AIClothingItem[] => {
  console.log('=== FILTERING FOR INDIVIDUAL CLOTHING ITEMS (3 WORDS MAX) ===');
  
  const filteredItems: AIClothingItem[] = [];
  
  // Words that indicate combinations or styling rather than individual items
  const combinationWords = ['and', 'with', 'of', 'pairing', 'combination', 'choice', 'providing', 'against', 'complements', 'ensemble'];
  const invalidPhrases = ['pairing of', 'choice of', 'with', 'providing', 'contrast against', 'complements', 'tones of'];
  
  // Valid single clothing items from our whitelist structure
  const validClothingNouns = [
    'shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'hoodie', 't-shirt', 'tee', 'polo', 'vest', 'coat', 'turtleneck', 'tank', 'camisole',
    'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'chinos', 'slacks',
    'dress', 'gown', 'sundress', 'maxi', 'midi',
    'shoes', 'sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers', 'oxfords', 'pumps',
    'belt', 'bag', 'purse', 'backpack', 'hat', 'cap', 'scarf', 'socks', 'jewelry', 'necklace', 'bracelet', 'earrings', 'watch', 'sunglasses'
  ];

  for (const item of items) {
    const itemName = item.name.toLowerCase();
    const wordCount = item.name.trim().split(/\s+/).length;
    
    // Reject if more than 3 words
    if (wordCount > 3) {
      console.log(`❌ Rejecting (too many words): "${item.name}" (${wordCount} words)`);
      continue;
    }
    
    // Check if this contains invalid combination phrases
    const hasInvalidPhrase = invalidPhrases.some(phrase => itemName.includes(phrase));
    if (hasInvalidPhrase) {
      console.log(`❌ Rejecting invalid phrase: "${item.name}"`);
      continue;
    }
    
    // Check if this is a combination tag (contains "and", "with", etc.)
    const isCombination = combinationWords.some(word => itemName.includes(` ${word} `));
    if (isCombination) {
      console.log(`❌ Rejecting combination tag: "${item.name}"`);
      continue;
    }
    
    // Check if it contains a valid clothing noun
    const containsValidNoun = validClothingNouns.some(noun => 
      itemName.includes(noun) || item.name.toLowerCase().includes(noun)
    );
    
    if (!containsValidNoun) {
      console.log(`❌ Rejecting (no clothing noun): "${item.name}"`);
      continue;
    }
    
    // Clean and validate the item
    const cleanedItem = cleanAndValidateItem(item, validClothingNouns);
    if (cleanedItem) {
      console.log(`✅ Accepting individual item: "${cleanedItem.name}" (${cleanedItem.name.split(' ').length} words)`);
      filteredItems.push(cleanedItem);
    }
  }
  
  console.log(`Filtered ${items.length} items down to ${filteredItems.length} valid individual clothing items`);
  return filteredItems;
};

export const cleanAndValidateItem = (item: AIClothingItem, validNouns: string[]): AIClothingItem | null => {
  let cleanName = item.name;
  
  // Remove common prefixes and styling words
  cleanName = cleanName.replace(/^(the|a|an)\s+/i, '');
  cleanName = cleanName.replace(/\b(pairing|choice|providing|contrast|complements|tones)\s*(of\s*)?/gi, '');
  
  // Clean up spacing and capitalization
  cleanName = cleanName.replace(/\s+/g, ' ').trim();
  
  // Check word count after cleaning
  const words = cleanName.split(' ');
  if (words.length > 3) {
    console.log(`❌ Still too many words after cleaning: "${cleanName}" (${words.length} words)`);
    return null;
  }
  
  // Ensure proper capitalization
  cleanName = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Final validation: must contain a clothing noun
  const hasValidNoun = validNouns.some(noun => 
    cleanName.toLowerCase().includes(noun)
  );
  
  if (!hasValidNoun) {
    console.log(`❌ No valid clothing noun in cleaned name: "${cleanName}"`);
    return null;
  }
  
  return {
    ...item,
    name: cleanName,
    category: categorizeClothingItem(cleanName.toLowerCase())
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
