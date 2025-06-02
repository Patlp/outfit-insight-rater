
import { Gender } from '@/context/RatingContext';
import { parseProductSuggestionsSimplified } from './product/simplifiedProductParser';

export interface ProductSuggestion {
  name: string;
  context: string;
  category: string;
  searchTerm: string;
  rationale: string;
}

export const parseProductSuggestions = (
  suggestions: string[], 
  gender: Gender
): ProductSuggestion[] => {
  console.log('=== REDIRECTING TO SIMPLIFIED PARSER ===');
  console.log('Input suggestions:', suggestions);
  console.log('Gender:', gender);
  
  // Use the simplified parser for all product parsing
  return parseProductSuggestionsSimplified(suggestions, gender, '');
};
