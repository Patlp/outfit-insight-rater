
import { Gender, OccasionContext } from '@/context/RatingContext';

export interface SearchContext {
  occasion?: string;
  feedback?: string;
  userGender: Gender;
  productCategory: string;
}

export const generateContextualSearchTerm = (
  baseProductTerm: string,
  context: SearchContext
): string => {
  console.log('Generating contextual search term:', { baseProductTerm, context });
  
  const { occasion, userGender } = context;
  
  // Clean the base product term
  let searchTerm = baseProductTerm
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Only add gender prefix if not already present
  const genderPrefix = userGender === 'male' ? 'mens' : 'womens';
  if (!searchTerm.includes('mens') && !searchTerm.includes('womens')) {
    searchTerm = `${genderPrefix} ${searchTerm}`;
  }
  
  // Only add occasion context if it's specific and relevant
  if (occasion && !occasion.toLowerCase().includes('neutral') && !occasion.toLowerCase().includes('general')) {
    const occasionKeywords = extractRelevantOccasionKeywords(occasion);
    if (occasionKeywords && isOccasionRelevant(searchTerm, occasionKeywords)) {
      searchTerm = `${searchTerm} ${occasionKeywords}`;
    }
  }
  
  // Final cleanup
  searchTerm = searchTerm
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log('Generated contextual search term:', searchTerm);
  return searchTerm;
};

const extractRelevantOccasionKeywords = (occasion: string): string => {
  const occasionLower = occasion.toLowerCase();
  
  // Only return keywords for very specific occasions
  if (occasionLower.includes('work') || occasionLower.includes('office') || occasionLower.includes('business')) {
    return 'office';
  }
  if (occasionLower.includes('formal') || occasionLower.includes('wedding') || occasionLower.includes('gala')) {
    return 'formal';
  }
  if (occasionLower.includes('athletic') || occasionLower.includes('gym') || occasionLower.includes('workout')) {
    return 'athletic';
  }
  
  // Don't add keywords for casual, date, party contexts as they're too generic
  return '';
};

const isOccasionRelevant = (searchTerm: string, occasionKeywords: string): boolean => {
  // Only add occasion context for certain product types
  const relevantForOffice = searchTerm.includes('shirt') || searchTerm.includes('blazer') || searchTerm.includes('pants') || searchTerm.includes('dress');
  const relevantForFormal = searchTerm.includes('shirt') || searchTerm.includes('dress') || searchTerm.includes('suit') || searchTerm.includes('shoes');
  const relevantForAthletic = searchTerm.includes('shoes') || searchTerm.includes('shorts') || searchTerm.includes('top');
  
  if (occasionKeywords === 'office' && relevantForOffice) return true;
  if (occasionKeywords === 'formal' && relevantForFormal) return true;
  if (occasionKeywords === 'athletic' && relevantForAthletic) return true;
  
  return false;
};
