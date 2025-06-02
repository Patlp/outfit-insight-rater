
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
  console.log('Generating fallbacks for suggestions:', suggestions);
  console.log('Existing suggestions count:', existingSuggestions.length);
  
  const fallbacks: FallbackSuggestion[] = [];
  const existingCategories = new Set(existingSuggestions.map(s => s.category));
  const combinedSuggestionText = suggestions.join(' ').toLowerCase();
  
  console.log('Combined suggestion text:', combinedSuggestionText);
  console.log('Existing categories:', Array.from(existingCategories));
  
  // Enhanced condition detection with more keywords
  const needsAccessories = combinedSuggestionText.includes('accessory') || 
                          combinedSuggestionText.includes('complete') ||
                          combinedSuggestionText.includes('finishing') ||
                          combinedSuggestionText.includes('jewelry') ||
                          combinedSuggestionText.includes('necklace') ||
                          combinedSuggestionText.includes('watch') ||
                          combinedSuggestionText.includes('belt');
                          
  const needsFootwear = combinedSuggestionText.includes('shoe') || 
                       combinedSuggestionText.includes('foundation') ||
                       combinedSuggestionText.includes('footwear') ||
                       combinedSuggestionText.includes('sneaker') ||
                       combinedSuggestionText.includes('boot') ||
                       combinedSuggestionText.includes('heel');
                       
  const needsStructure = combinedSuggestionText.includes('structure') || 
                        combinedSuggestionText.includes('layer') ||
                        combinedSuggestionText.includes('blazer') ||
                        combinedSuggestionText.includes('jacket') ||
                        combinedSuggestionText.includes('cardigan') ||
                        combinedSuggestionText.includes('polish') ||
                        combinedSuggestionText.includes('professional');
  
  console.log('Conditions:', { needsAccessories, needsFootwear, needsStructure });
  
  // Expanded gender-specific fallbacks with more options
  const genderFallbacks = gender === 'female' 
    ? [
        { name: 'Gold Stud Earrings', category: 'accessories', searchTerm: 'gold stud earrings', rationale: 'Finishing Touch', condition: needsAccessories },
        { name: 'Delicate Gold Necklace', category: 'accessories', searchTerm: 'delicate gold necklace', rationale: 'Complete Look', condition: needsAccessories },
        { name: 'White Leather Sneakers', category: 'footwear', searchTerm: 'white leather sneakers', rationale: 'Foundation Upgrade', condition: needsFootwear },
        { name: 'Block Heel Pumps', category: 'footwear', searchTerm: 'block heel pumps', rationale: 'Professional Polish', condition: needsFootwear },
        { name: 'Tailored Blazer', category: 'outerwear', searchTerm: 'structured blazer', rationale: 'Professional Polish', condition: needsStructure },
        { name: 'Knit Cardigan', category: 'outerwear', searchTerm: 'knit cardigan', rationale: 'Layer Addition', condition: needsStructure }
      ]
    : [
        { name: 'Leather Strap Watch', category: 'accessories', searchTerm: 'leather strap watch', rationale: 'Finishing Touch', condition: needsAccessories },
        { name: 'Brown Leather Belt', category: 'accessories', searchTerm: 'brown leather belt', rationale: 'Complete Look', condition: needsAccessories },
        { name: 'White Leather Sneakers', category: 'footwear', searchTerm: 'white leather sneakers', rationale: 'Foundation Upgrade', condition: needsFootwear },
        { name: 'Oxford Dress Shoes', category: 'footwear', searchTerm: 'oxford dress shoes', rationale: 'Professional Polish', condition: needsFootwear },
        { name: 'Navy Blazer', category: 'outerwear', searchTerm: 'casual blazer', rationale: 'Style Elevation', condition: needsStructure },
        { name: 'V-Neck Sweater', category: 'outerwear', searchTerm: 'v-neck sweater', rationale: 'Layer Addition', condition: needsStructure }
      ];

  // Add fallbacks only if their condition is met and category isn't filled
  for (const fallback of genderFallbacks) {
    if (fallbacks.length >= 3 - existingSuggestions.length) break;
    
    console.log(`Checking fallback: ${fallback.name}, condition: ${fallback.condition}, category exists: ${existingCategories.has(fallback.category)}`);
    
    if (fallback.condition && !existingCategories.has(fallback.category)) {
      const genderSpecificSearchTerm = createGenderSpecificSearchTerm(fallback.searchTerm, gender);
      
      const fallbackItem = {
        name: `${fallback.rationale}: ${fallback.name}`,
        context: generateContextualDescription(fallback.category, suggestions.join(' ')),
        category: fallback.category,
        searchTerm: genderSpecificSearchTerm,
        rationale: fallback.rationale
      };
      
      console.log('Adding fallback:', fallbackItem);
      fallbacks.push(fallbackItem);
      existingCategories.add(fallback.category);
    }
  }

  console.log('Final fallbacks count:', fallbacks.length);
  return fallbacks;
};
