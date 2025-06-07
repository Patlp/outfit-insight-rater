
// Grammar and structure validation for clothing tags
export interface TagStructureRules {
  maxWords: number;
  allowedPatterns: string[];
  forbiddenWords: string[];
  requiredComponents: {
    descriptor?: boolean;
    clothingItem: boolean;
  };
}

const DEFAULT_TAG_RULES: TagStructureRules = {
  maxWords: 2,
  allowedPatterns: [
    'DESCRIPTOR CLOTHING_ITEM', // e.g., "Blue Shirt"
    'CLOTHING_ITEM' // e.g., "Shirt"
  ],
  forbiddenWords: [
    'of', 'with', 'and', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 
    'from', 'by', 'against', 'choice', 'pairing', 'providing', 'contrast',
    'complements', 'tones', 'featuring', 'worn', 'outfit'
  ],
  requiredComponents: {
    clothingItem: true
  }
};

export const validateTagStructure = (tag: string, rules: TagStructureRules = DEFAULT_TAG_RULES): { 
  isValid: boolean; 
  errors: string[]; 
  correctedTag?: string;
} => {
  const errors: string[] = [];
  const words = tag.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  
  // Check word count
  if (words.length > rules.maxWords) {
    errors.push(`Exceeds maximum ${rules.maxWords} words (has ${words.length})`);
  }
  
  // Check for forbidden words
  const forbiddenFound = words.filter(word => rules.forbiddenWords.includes(word));
  if (forbiddenFound.length > 0) {
    errors.push(`Contains forbidden words: ${forbiddenFound.join(', ')}`);
  }
  
  // Check for clothing item presence
  if (rules.requiredComponents.clothingItem) {
    const clothingItems = [
      'shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'hoodie', 't-shirt', 'tee', 'polo', 'vest', 'coat',
      'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'chinos', 'slacks',
      'dress', 'gown', 'sundress', 'maxi', 'midi',
      'shoes', 'sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers', 'oxfords', 'pumps',
      'belt', 'bag', 'purse', 'backpack', 'hat', 'cap', 'scarf', 'socks', 'jewelry', 'necklace', 'bracelet', 'earrings', 'watch', 'sunglasses'
    ];
    
    const hasClothingItem = words.some(word => 
      clothingItems.some(item => word.includes(item) || item.includes(word))
    );
    
    if (!hasClothingItem) {
      errors.push('Must contain a recognizable clothing item');
    }
  }
  
  // Generate corrected tag if possible
  let correctedTag: string | undefined;
  if (errors.length > 0 && words.length > 0) {
    // Try to salvage the tag by removing forbidden words and truncating
    const cleanWords = words
      .filter(word => !rules.forbiddenWords.includes(word))
      .slice(0, rules.maxWords);
    
    if (cleanWords.length > 0) {
      correctedTag = cleanWords
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    correctedTag
  };
};

export const enforceTagGrammar = (tags: string[]): string[] => {
  return tags
    .map(tag => {
      const validation = validateTagStructure(tag);
      if (validation.isValid) {
        return tag;
      } else if (validation.correctedTag) {
        console.log(`Grammar correction: "${tag}" → "${validation.correctedTag}"`);
        return validation.correctedTag;
      }
      return null;
    })
    .filter((tag): tag is string => tag !== null);
};

export const formatTagName = (descriptor: string | null, clothingItem: string): string => {
  const words: string[] = [];
  
  if (descriptor && descriptor.length > 0) {
    // Clean and validate descriptor
    const cleanDescriptor = descriptor
      .toLowerCase()
      .replace(/[^a-z\s-]/g, '')
      .trim();
    
    if (cleanDescriptor && !DEFAULT_TAG_RULES.forbiddenWords.includes(cleanDescriptor)) {
      words.push(cleanDescriptor);
    }
  }
  
  // Clean and add clothing item
  const cleanClothingItem = clothingItem
    .toLowerCase()
    .replace(/[^a-z\s-]/g, '')
    .trim();
  
  if (cleanClothingItem) {
    words.push(cleanClothingItem);
  }
  
  // Limit to 2 words maximum
  const finalWords = words.slice(0, 2);
  
  // Capitalize each word
  return finalWords
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
