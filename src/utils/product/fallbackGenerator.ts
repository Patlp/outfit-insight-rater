
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
  console.log('=== GENERATING FALLBACKS ===');
  console.log('Suggestions:', suggestions);
  console.log('Gender:', gender);
  console.log('Existing suggestions count:', existingSuggestions.length);
  
  const fallbacks: FallbackSuggestion[] = [];
  const existingCategories = new Set(existingSuggestions.map(s => s.category));
  const combinedSuggestionText = suggestions.join(' ').toLowerCase();
  
  console.log('Combined suggestion text:', combinedSuggestionText);
  console.log('Existing categories:', Array.from(existingCategories));
  
  // Enhanced condition detection with more comprehensive keywords
  const conditionChecks = {
    needsAccessories: [
      'accessory', 'accessories', 'complete', 'finishing', 'finish', 'polish',
      'jewelry', 'jewellery', 'necklace', 'earrings', 'bracelet', 'watch', 'belt',
      'bag', 'purse', 'scarf', 'detail', 'details', 'accent', 'accents'
    ],
    needsFootwear: [
      'shoe', 'shoes', 'footwear', 'foundation', 'base', 'ground', 'anchor',
      'sneaker', 'sneakers', 'boot', 'boots', 'heel', 'heels', 'flat', 'flats',
      'sandal', 'sandals', 'pump', 'pumps', 'loafer', 'loafers'
    ],
    needsStructure: [
      'structure', 'structured', 'layer', 'layers', 'layering', 'blazer', 'jacket',
      'cardigan', 'coat', 'outerwear', 'polish', 'polished', 'professional',
      'tailored', 'sharp', 'sophisticated', 'elevate', 'elevation'
    ],
    needsColor: [
      'color', 'colour', 'coordinate', 'complement', 'palette', 'tone', 'contrast',
      'bright', 'pop', 'vibrant', 'neutral', 'balance', 'harmony'
    ]
  };

  // Check conditions with enhanced detection
  const conditions = Object.entries(conditionChecks).reduce((acc, [key, keywords]) => {
    acc[key] = keywords.some(keyword => combinedSuggestionText.includes(keyword));
    return acc;
  }, {} as Record<string, boolean>);
  
  console.log('Detected conditions:', conditions);
  
  // Enhanced gender-specific fallbacks with more variety
  const genderFallbacks = gender === 'female' 
    ? [
        // Accessories
        { name: 'Delicate Gold Necklace', category: 'accessories', searchTerm: 'delicate gold necklace', rationale: 'Finishing Touch', condition: conditions.needsAccessories },
        { name: 'Gold Stud Earrings', category: 'accessories', searchTerm: 'gold stud earrings', rationale: 'Complete Look', condition: conditions.needsAccessories },
        { name: 'Structured Crossbody Bag', category: 'accessories', searchTerm: 'structured crossbody bag', rationale: 'Polish Addition', condition: conditions.needsAccessories },
        { name: 'Thin Leather Belt', category: 'accessories', searchTerm: 'thin leather belt', rationale: 'Waist Definition', condition: conditions.needsAccessories },
        
        // Footwear
        { name: 'White Leather Sneakers', category: 'footwear', searchTerm: 'white leather sneakers', rationale: 'Foundation Upgrade', condition: conditions.needsFootwear },
        { name: 'Block Heel Pumps', category: 'footwear', searchTerm: 'block heel pumps', rationale: 'Professional Polish', condition: conditions.needsFootwear },
        { name: 'Classic Ballet Flats', category: 'footwear', searchTerm: 'ballet flats', rationale: 'Comfort & Style', condition: conditions.needsFootwear },
        
        // Structure/Layers
        { name: 'Tailored Blazer', category: 'outerwear', searchTerm: 'tailored blazer', rationale: 'Professional Polish', condition: conditions.needsStructure },
        { name: 'Soft Knit Cardigan', category: 'outerwear', searchTerm: 'knit cardigan', rationale: 'Layer Addition', condition: conditions.needsStructure },
        { name: 'Cropped Denim Jacket', category: 'outerwear', searchTerm: 'denim jacket', rationale: 'Casual Structure', condition: conditions.needsStructure }
      ]
    : [
        // Accessories
        { name: 'Leather Strap Watch', category: 'accessories', searchTerm: 'leather strap watch', rationale: 'Finishing Touch', condition: conditions.needsAccessories },
        { name: 'Brown Leather Belt', category: 'accessories', searchTerm: 'brown leather belt', rationale: 'Complete Look', condition: conditions.needsAccessories },
        { name: 'Canvas Messenger Bag', category: 'accessories', searchTerm: 'messenger bag', rationale: 'Functional Style', condition: conditions.needsAccessories },
        
        // Footwear
        { name: 'White Leather Sneakers', category: 'footwear', searchTerm: 'white leather sneakers', rationale: 'Foundation Upgrade', condition: conditions.needsFootwear },
        { name: 'Oxford Dress Shoes', category: 'footwear', searchTerm: 'oxford dress shoes', rationale: 'Professional Polish', condition: conditions.needsFootwear },
        { name: 'Classic Loafers', category: 'footwear', searchTerm: 'leather loafers', rationale: 'Refined Casual', condition: conditions.needsFootwear },
        
        // Structure/Layers
        { name: 'Navy Blazer', category: 'outerwear', searchTerm: 'navy blazer', rationale: 'Style Elevation', condition: conditions.needsStructure },
        { name: 'V-Neck Cardigan', category: 'outerwear', searchTerm: 'v-neck cardigan', rationale: 'Layer Addition', condition: conditions.needsStructure },
        { name: 'Casual Denim Jacket', category: 'outerwear', searchTerm: 'denim jacket', rationale: 'Casual Structure', condition: conditions.needsStructure }
      ];

  // Priority order: accessories, footwear, then structure
  const priorityOrder = ['accessories', 'footwear', 'outerwear'];
  
  for (const categoryPriority of priorityOrder) {
    if (fallbacks.length >= 3 - existingSuggestions.length) break;
    
    const categoryFallbacks = genderFallbacks.filter(fb => 
      fb.category === categoryPriority && 
      fb.condition && 
      !existingCategories.has(fb.category)
    );
    
    for (const fallback of categoryFallbacks) {
      if (fallbacks.length >= 3 - existingSuggestions.length) break;
      
      console.log(`Adding priority fallback: ${fallback.name} (${fallback.category})`);
      
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
  }

  // If still need more, add from remaining valid fallbacks
  if (fallbacks.length < 3 - existingSuggestions.length) {
    const remainingFallbacks = genderFallbacks.filter(fb => 
      !existingCategories.has(fb.category) && 
      !fallbacks.some(existing => existing.category === fb.category)
    );
    
    for (const fallback of remainingFallbacks) {
      if (fallbacks.length >= 3 - existingSuggestions.length) break;
      
      console.log(`Adding remaining fallback: ${fallback.name}`);
      
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
  }

  console.log(`Generated ${fallbacks.length} fallbacks`);
  fallbacks.forEach((fb, i) => console.log(`${i + 1}. ${fb.name}`));
  
  return fallbacks;
};
