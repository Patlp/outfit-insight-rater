
// Clean clothing tag extraction for Auto Wardrobe feature
// Extracts specific wearable items from AI outfit analysis text

interface ClothingTagResult {
  tags: string[];
  success: boolean;
  error?: string;
}

export const extractCleanClothingTags = async (insight: string): Promise<ClothingTagResult> => {
  try {
    console.log('=== CLEAN TAG EXTRACTION START ===');
    console.log('Input insight length:', insight.length);
    
    if (!insight || insight.trim().length === 0) {
      return { tags: [], success: true };
    }

    // Define patterns for clothing items with descriptors
    const clothingPatterns = [
      // Color + Pattern/Style + Item patterns
      /\b(?:red|blue|green|yellow|orange|purple|pink|black|white|gray|grey|brown|navy|beige|cream|tan|olive|maroon|teal|coral|burgundy|khaki|mint|lavender)\s+(?:floral|striped|plaid|checkered|polka\s+dot|geometric|solid|paisley|leopard|zebra|camouflage|tie-dye|ombre)?\s*(?:silk|cotton|wool|linen|cashmere|velvet|satin|chiffon|suede|leather|denim|mesh|lace)?\s*(shirt|blouse|top|sweater|cardigan|jacket|blazer|hoodie|t-shirt|tee|polo|vest|coat|pants|jeans|trousers|shorts|skirt|dress|shoes|sneakers|heels|boots|sandals|flats|belt|bag|hat|scarf|necklace|bracelet|watch|earrings)\b/gi,
      
      // Style/Fit + Item patterns
      /\b(?:oversized|fitted|loose|tight|slim|cropped|high-waisted|low-rise|wide-leg|skinny|straight|bootcut|relaxed|tailored|structured|flowy|wrap|off-shoulder|strapless|sleeveless|long-sleeve|short-sleeve|v-neck|crew|turtleneck|button-down|zip-up)\s+(shirt|blouse|top|sweater|cardigan|jacket|blazer|hoodie|t-shirt|tee|polo|vest|coat|pants|jeans|trousers|shorts|skirt|dress|shoes|sneakers|heels|boots|sandals|flats|belt|bag|hat|scarf|necklace|bracelet|watch|earrings)\b/gi,
      
      // Material + Item patterns
      /\b(?:silk|cotton|wool|linen|cashmere|velvet|satin|chiffon|suede|leather|denim|mesh|lace|polyester|nylon|spandex|jersey|knit|tweed|corduroy)\s+(shirt|blouse|top|sweater|cardigan|jacket|blazer|hoodie|t-shirt|tee|polo|vest|coat|pants|jeans|trousers|shorts|skirt|dress|shoes|sneakers|heels|boots|sandals|flats|belt|bag|hat|scarf|necklace|bracelet|watch|earrings)\b/gi,
      
      // Simple item patterns (fallback)
      /\b(shirt|blouse|top|sweater|cardigan|jacket|blazer|hoodie|t-shirt|tee|polo|vest|coat|pants|jeans|trousers|shorts|skirt|dress|shoes|sneakers|heels|boots|sandals|flats|loafers|belt|bag|purse|handbag|backpack|hat|cap|scarf|gloves|necklace|bracelet|watch|earrings|sunglasses)\b/gi
    ];

    // Words to exclude (not wearable items)
    const excludeWords = [
      'woman', 'man', 'person', 'people', 'girl', 'boy', 'lady', 'gentleman',
      'posing', 'walking', 'standing', 'sitting', 'wearing', 'styled',
      'elegant', 'sporty', 'casual', 'formal', 'trendy', 'classic', 'modern', 'vintage',
      'look', 'style', 'outfit', 'ensemble', 'appearance', 'vibe', 'aesthetic',
      'recommendation', 'suggestion', 'advice', 'tip', 'idea', 'option',
      'overall', 'general', 'complete', 'perfect', 'ideal', 'best', 'good', 'great'
    ];

    const extractedTags = new Set<string>();

    // Process each pattern
    clothingPatterns.forEach(pattern => {
      let match;
      pattern.lastIndex = 0; // Reset regex
      
      while ((match = pattern.exec(insight)) !== null) {
        let tag = match[0].toLowerCase().trim();
        
        // Clean up the tag
        tag = tag
          .replace(/\b(the|a|an|this|that|your|my|their|his|her)\b/g, '') // Remove articles/pronouns
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();

        // Skip if tag contains excluded words
        const containsExcluded = excludeWords.some(excludeWord => 
          tag.includes(excludeWord.toLowerCase())
        );
        
        if (!containsExcluded && tag.length > 2 && tag.length < 50) {
          // Capitalize first letter of each word
          const formattedTag = tag.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          extractedTags.add(formattedTag);
        }
      }
    });

    // Convert to array and limit to reasonable number
    const finalTags = Array.from(extractedTags)
      .filter(tag => {
        // Final validation: ensure it's actually a clothing item
        const clothingKeywords = [
          'shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'hoodie', 't-shirt', 'tee', 'polo', 'vest', 'coat',
          'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'dress',
          'shoes', 'sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers',
          'belt', 'bag', 'purse', 'handbag', 'backpack', 'hat', 'cap', 'scarf', 'gloves',
          'necklace', 'bracelet', 'watch', 'earrings', 'sunglasses'
        ];
        
        return clothingKeywords.some(keyword => 
          tag.toLowerCase().includes(keyword)
        );
      })
      .slice(0, 8); // Limit to 8 most relevant tags

    console.log(`Extracted ${finalTags.length} clean clothing tags:`, finalTags);
    console.log('=== CLEAN TAG EXTRACTION COMPLETE ===');

    return { tags: finalTags, success: true };

  } catch (error) {
    console.error('Error in clean tag extraction:', error);
    return { 
      tags: [], 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    };
  }
};

// Helper function for testing/validation
export const validateClothingTag = (tag: string): boolean => {
  const clothingKeywords = [
    'shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'hoodie', 't-shirt', 'tee', 'polo', 'vest', 'coat',
    'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'dress',
    'shoes', 'sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers',
    'belt', 'bag', 'purse', 'handbag', 'backpack', 'hat', 'cap', 'scarf', 'gloves',
    'necklace', 'bracelet', 'watch', 'earrings', 'sunglasses'
  ];
  
  const excludeWords = [
    'woman', 'man', 'person', 'people', 'posing', 'walking', 'elegant', 'sporty', 'look', 'style', 'outfit'
  ];
  
  const lowerTag = tag.toLowerCase();
  
  const hasClothingKeyword = clothingKeywords.some(keyword => lowerTag.includes(keyword));
  const hasExcludedWord = excludeWords.some(word => lowerTag.includes(word));
  
  return hasClothingKeyword && !hasExcludedWord && tag.length > 2 && tag.length < 50;
};
