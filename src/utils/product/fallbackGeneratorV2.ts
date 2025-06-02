
import { Gender } from '@/context/RatingContext';
import { createGenderSpecificSearchTerm } from './searchTermGenerator';
import { generateContextualDescription } from './contextGenerator';

export interface FallbackSuggestionV2 {
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
): FallbackSuggestionV2[] => {
  console.log('=== GENERATING FALLBACKS V2 ===');
  console.log('Suggestions:', suggestions);
  console.log('Gender:', gender);
  console.log('Existing suggestions count:', existingSuggestions.length);
  
  const fallbacks: FallbackSuggestionV2[] = [];
  const existingCategories = new Set(existingSuggestions.map(s => s.category));
  const combinedSuggestionText = suggestions.join(' ').toLowerCase();
  
  console.log('Combined suggestion text:', combinedSuggestionText);
  console.log('Existing categories:', Array.from(existingCategories));
  
  // Enhanced context detection
  const contextChecks = {
    isSummer: ['summer', 'hot', 'beach', 'sun', 'warm', 'heat', 'breathable', 'light', 'cool'],
    isWinter: ['winter', 'cold', 'snow', 'warm', 'layer', 'coat', 'thermal'],
    isProfessional: ['work', 'office', 'professional', 'business', 'formal', 'meeting'],
    isCasual: ['casual', 'relaxed', 'comfortable', 'weekend', 'everyday'],
    needsBreathability: ['breathable', 'cotton', 'linen', 'air', 'ventilation', 'cooling'],
    needsStructure: ['structure', 'tailored', 'blazer', 'jacket', 'polish', 'sophisticated'],
    needsAccessories: ['accessories', 'complete', 'finishing', 'jewelry', 'bag', 'belt', 'watch'],
    needsFootwear: ['shoes', 'footwear', 'foundation', 'ground', 'base']
  };

  // Detect context
  const contexts = Object.entries(contextChecks).reduce((acc, [key, keywords]) => {
    acc[key] = keywords.some(keyword => combinedSuggestionText.includes(keyword));
    return acc;
  }, {} as Record<string, boolean>);
  
  console.log('Detected contexts:', contexts);
  
  // Context-aware fallbacks
  const contextualFallbacks = gender === 'female' 
    ? [
        // Summer/Breathable options
        ...(contexts.isSummer || contexts.needsBreathability ? [
          { name: 'Breathable Cotton Top', category: 'tops', searchTerm: 'cotton blouse', rationale: 'Breathable Choice', priority: 1 },
          { name: 'Linen Wide-Leg Pants', category: 'bottoms', searchTerm: 'linen pants', rationale: 'Cool Comfort', priority: 1 },
          { name: 'Canvas Sneakers', category: 'footwear', searchTerm: 'canvas sneakers', rationale: 'Breathable Base', priority: 2 },
        ] : []),
        
        // Professional options
        ...(contexts.isProfessional || contexts.needsStructure ? [
          { name: 'Tailored Blazer', category: 'outerwear', searchTerm: 'tailored blazer', rationale: 'Professional Polish', priority: 1 },
          { name: 'Structured Handbag', category: 'accessories', searchTerm: 'structured handbag', rationale: 'Complete Look', priority: 2 },
        ] : []),
        
        // General essentials
        { name: 'Classic White Sneakers', category: 'footwear', searchTerm: 'white sneakers', rationale: 'Foundation Upgrade', priority: 3 },
        { name: 'Gold Stud Earrings', category: 'accessories', searchTerm: 'gold stud earrings', rationale: 'Finishing Touch', priority: 3 },
        { name: 'Soft Knit Cardigan', category: 'outerwear', searchTerm: 'knit cardigan', rationale: 'Layer Addition', priority: 4 },
      ]
    : [
        // Summer/Breathable options
        ...(contexts.isSummer || contexts.needsBreathability ? [
          { name: 'Cotton Polo Shirt', category: 'tops', searchTerm: 'cotton polo shirt', rationale: 'Breathable Choice', priority: 1 },
          { name: 'Linen Chinos', category: 'bottoms', searchTerm: 'linen chinos', rationale: 'Cool Comfort', priority: 1 },
          { name: 'Canvas Sneakers', category: 'footwear', searchTerm: 'canvas sneakers', rationale: 'Breathable Base', priority: 2 },
        ] : []),
        
        // Professional options
        ...(contexts.isProfessional || contexts.needsStructure ? [
          { name: 'Navy Blazer', category: 'outerwear', searchTerm: 'navy blazer', rationale: 'Professional Polish', priority: 1 },
          { name: 'Leather Watch', category: 'accessories', searchTerm: 'leather watch', rationale: 'Complete Look', priority: 2 },
        ] : []),
        
        // General essentials
        { name: 'White Leather Sneakers', category: 'footwear', searchTerm: 'white sneakers', rationale: 'Foundation Upgrade', priority: 3 },
        { name: 'Brown Leather Belt', category: 'accessories', searchTerm: 'leather belt', rationale: 'Finishing Touch', priority: 3 },
        { name: 'V-Neck Cardigan', category: 'outerwear', searchTerm: 'v-neck cardigan', rationale: 'Layer Addition', priority: 4 },
      ];

  // Sort by priority and filter by available categories
  const availableFallbacks = contextualFallbacks
    .filter(fb => !existingCategories.has(fb.category))
    .sort((a, b) => a.priority - b.priority);
  
  // Add fallbacks up to limit
  const maxFallbacks = 3 - existingSuggestions.length;
  for (let i = 0; i < Math.min(availableFallbacks.length, maxFallbacks); i++) {
    const fallback = availableFallbacks[i];
    
    console.log(`Adding contextual fallback: ${fallback.name} (${fallback.category})`);
    
    const genderSpecificSearchTerm = createGenderSpecificSearchTerm(fallback.searchTerm, gender);
    
    const fallbackItem = {
      name: `${fallback.rationale}: ${fallback.name}`,
      context: generateContextualDescription(fallback.category, suggestions.join(' ')),
      category: fallback.category,
      searchTerm: genderSpecificSearchTerm,
      rationale: fallback.rationale
    };
    
    fallbacks.push(fallbackItem);
    existingCategories.add(fallback.category);
  }

  console.log(`Generated ${fallbacks.length} contextual fallbacks`);
  fallbacks.forEach((fb, i) => console.log(`${i + 1}. ${fb.name}`));
  
  return fallbacks;
};
