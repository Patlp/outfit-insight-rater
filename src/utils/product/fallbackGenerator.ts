
import { Gender } from '@/context/RatingContext';
import { createGenderSpecificSearchTerm } from './searchTermGenerator';
import { generateContextualDescription } from './contextGenerator';

export interface FallbackSuggestion {
  name: string;
  context: string;
  category: string;
  searchTerm: string;
  rationale: string;
}

export const generateStrictFallbacks = (
  suggestions: string[], 
  gender: Gender, 
  existingSuggestions: any[]
): FallbackSuggestion[] => {
  const fallbacks: FallbackSuggestion[] = [];
  const existingCategories = new Set(existingSuggestions.map(s => s.category));
  const combinedSuggestionText = suggestions.join(' ').toLowerCase();
  
  // Only add fallbacks if there are clear style needs mentioned but no specific items found
  const needsAccessories = combinedSuggestionText.includes('accessory') || combinedSuggestionText.includes('complete');
  const needsFootwear = combinedSuggestionText.includes('shoe') || combinedSuggestionText.includes('foundation');
  const needsStructure = combinedSuggestionText.includes('structure') || combinedSuggestionText.includes('layer');
  
  // Gender-specific strict fallbacks - only specific clothing items
  const genderFallbacks = gender === 'female' 
    ? [
        { name: 'Gold Stud Earrings', category: 'accessories', searchTerm: 'gold stud earrings', rationale: 'Finishing Touch', condition: needsAccessories },
        { name: 'White Leather Sneakers', category: 'footwear', searchTerm: 'white leather sneakers', rationale: 'Foundation Upgrade', condition: needsFootwear },
        { name: 'Tailored Blazer', category: 'outerwear', searchTerm: 'structured blazer', rationale: 'Professional Polish', condition: needsStructure }
      ]
    : [
        { name: 'Leather Strap Watch', category: 'accessories', searchTerm: 'leather strap watch', rationale: 'Finishing Touch', condition: needsAccessories },
        { name: 'White Leather Sneakers', category: 'footwear', searchTerm: 'white leather sneakers', rationale: 'Foundation Upgrade', condition: needsFootwear },
        { name: 'Navy Blazer', category: 'outerwear', searchTerm: 'casual blazer', rationale: 'Style Elevation', condition: needsStructure }
      ];

  // Add fallbacks only if their condition is met and category isn't filled
  for (const fallback of genderFallbacks) {
    if (fallbacks.length >= 3 - existingSuggestions.length) break;
    
    if (fallback.condition && !existingCategories.has(fallback.category)) {
      const genderSpecificSearchTerm = createGenderSpecificSearchTerm(fallback.searchTerm, gender);
      
      fallbacks.push({
        name: `${fallback.rationale}: ${fallback.name}`,
        context: generateContextualDescription(fallback.category, suggestions.join(' ')),
        category: fallback.category,
        searchTerm: genderSpecificSearchTerm,
        rationale: fallback.rationale
      });
      
      existingCategories.add(fallback.category);
    }
  }

  return fallbacks;
};
