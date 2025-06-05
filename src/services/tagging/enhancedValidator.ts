
// Enhanced validator with strict two-word rule and Style section cross-checking

import { AIClothingItem } from '@/services/clothingExtractionService';
import { StyleReference, validateAgainstStyle } from './styleParser';

export interface ValidationResult {
  isValid: boolean;
  reasons: string[];
  finalConfidence: number;
}

export const validateClothingItem = (
  item: AIClothingItem, 
  styleReferences: StyleReference[]
): ValidationResult => {
  const reasons: string[] = [];
  let isValid = true;
  let finalConfidence = item.confidence || 0;

  console.log(`=== VALIDATING: "${item.name}" (initial confidence: ${finalConfidence.toFixed(2)}) ===`);

  // Rule 1: Must have 90% or greater confidence
  if (finalConfidence < 0.9) {
    isValid = false;
    reasons.push(`Confidence ${(finalConfidence * 100).toFixed(0)}% < 90% threshold`);
    console.log(`❌ RULE 1 FAILED: Low confidence (${(finalConfidence * 100).toFixed(0)}%)`);
  }

  // Rule 2: Maximum 2 words only
  const words = item.name.trim().split(/\s+/).filter(word => word.length > 0);
  if (words.length > 2) {
    isValid = false;
    reasons.push(`Too many words: ${words.length} (max 2)`);
    console.log(`❌ RULE 2 FAILED: ${words.length} words > 2 word limit`);
  }

  // Rule 3: No prepositions allowed
  const forbiddenWords = ['of', 'with', 'and', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'from', 'by', 'against', 'choice', 'pairing', 'providing', 'contrast', 'complements', 'tones'];
  const containsForbidden = words.some(word => forbiddenWords.includes(word.toLowerCase()));
  if (containsForbidden) {
    isValid = false;
    const forbiddenFound = words.filter(word => forbiddenWords.includes(word.toLowerCase()));
    reasons.push(`Contains forbidden words: ${forbiddenFound.join(', ')}`);
    console.log(`❌ RULE 3 FAILED: Contains prepositions: ${forbiddenFound.join(', ')}`);
  }

  // Rule 4: Must contain at least one valid clothing noun
  const validClothingNouns = [
    'shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'hoodie', 't-shirt', 'tee', 'polo', 'vest', 'coat', 'turtleneck', 'tank', 'camisole',
    'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'chinos', 'slacks',
    'dress', 'gown', 'sundress', 'maxi', 'midi',
    'shoes', 'sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers', 'oxfords', 'pumps',
    'belt', 'bag', 'purse', 'backpack', 'hat', 'cap', 'scarf', 'socks', 'jewelry', 'necklace', 'bracelet', 'earrings', 'watch', 'sunglasses'
  ];

  const hasValidNoun = validClothingNouns.some(noun => 
    item.name.toLowerCase().includes(noun)
  );
  
  if (!hasValidNoun) {
    isValid = false;
    reasons.push('No valid clothing item found');
    console.log(`❌ RULE 4 FAILED: No valid clothing noun in "${item.name}"`);
  }

  // Rule 5: Style section cross-validation
  const styleConfidence = validateAgainstStyle(item.name, styleReferences);
  finalConfidence = Math.min(0.98, finalConfidence * styleConfidence); // Apply style validation multiplier

  // Rule 6: Must follow [Descriptor] + [Item] format (2 words exactly)
  if (words.length === 2) {
    const [firstWord, secondWord] = words;
    
    // Check if first word is a valid descriptor
    const colorWords = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey', 'brown', 'navy', 'beige', 'cream', 'tan', 'olive', 'maroon', 'teal', 'coral', 'burgundy', 'khaki', 'mint', 'lavender', 'gold', 'silver', 'light', 'dark'];
    const materialWords = ['cotton', 'denim', 'leather', 'silk', 'wool', 'linen', 'cashmere', 'velvet', 'satin', 'chiffon', 'suede', 'mesh', 'lace'];
    const patternWords = ['striped', 'plaid', 'checkered', 'polka', 'floral', 'geometric', 'solid', 'fitted', 'oversized', 'cropped'];
    
    const isValidDescriptor = [...colorWords, ...materialWords, ...patternWords].some(desc => 
      firstWord.toLowerCase().includes(desc) || desc.includes(firstWord.toLowerCase())
    );
    
    const isValidClothingItem = validClothingNouns.some(noun => 
      secondWord.toLowerCase().includes(noun) || noun.includes(secondWord.toLowerCase())
    );

    if (!isValidDescriptor) {
      console.log(`⚠️ RULE 6 WARNING: First word "${firstWord}" is not a recognized descriptor`);
      finalConfidence *= 0.9; // Small penalty
    }

    if (!isValidClothingItem) {
      isValid = false;
      reasons.push('Second word is not a valid clothing item');
      console.log(`❌ RULE 6 FAILED: Second word "${secondWord}" is not a valid clothing item`);
    }
  } else if (words.length === 1) {
    // Single word must be a clothing item
    const isValidSingleItem = validClothingNouns.some(noun => 
      words[0].toLowerCase().includes(noun) || noun.includes(words[0].toLowerCase())
    );
    
    if (!isValidSingleItem) {
      isValid = false;
      reasons.push('Single word is not a valid clothing item');
      console.log(`❌ RULE 6 FAILED: Single word "${words[0]}" is not a valid clothing item`);
    }
  }

  // Final confidence check after all validations
  if (finalConfidence < 0.9) {
    isValid = false;
    reasons.push(`Final confidence ${(finalConfidence * 100).toFixed(0)}% < 90% after validation`);
  }

  const result = {
    isValid,
    reasons,
    finalConfidence
  };

  console.log(`=== VALIDATION RESULT for "${item.name}": ${isValid ? '✅ PASSED' : '❌ FAILED'} ===`);
  if (!isValid) {
    console.log(`Reasons: ${reasons.join(', ')}`);
  }
  console.log(`Final confidence: ${(finalConfidence * 100).toFixed(0)}%`);

  return result;
};

export const applyStrictValidation = (
  items: AIClothingItem[], 
  styleReferences: StyleReference[]
): AIClothingItem[] => {
  console.log(`=== APPLYING STRICT VALIDATION TO ${items.length} ITEMS ===`);
  
  const validatedItems: AIClothingItem[] = [];
  
  for (const item of items) {
    const validation = validateClothingItem(item, styleReferences);
    
    if (validation.isValid) {
      validatedItems.push({
        ...item,
        confidence: validation.finalConfidence
      });
    } else {
      console.log(`❌ Rejected "${item.name}": ${validation.reasons.join(', ')}`);
    }
  }

  console.log(`=== STRICT VALIDATION COMPLETE: ${validatedItems.length}/${items.length} items passed ===`);
  return validatedItems;
};
