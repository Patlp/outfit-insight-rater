
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
  
  const { occasion, feedback, userGender, productCategory } = context;
  
  // Start with gender-specific base
  const genderPrefix = userGender === 'male' ? 'mens' : 'womens';
  let searchTerm = `${genderPrefix} ${baseProductTerm}`;
  
  // Add occasion context if available
  if (occasion && !occasion.toLowerCase().includes('neutral')) {
    const occasionKeywords = extractOccasionKeywords(occasion);
    if (occasionKeywords) {
      searchTerm = `${searchTerm} ${occasionKeywords}`;
    }
  }
  
  // Add style context from feedback
  if (feedback) {
    const styleKeywords = extractStyleKeywords(feedback, productCategory);
    if (styleKeywords) {
      searchTerm = `${searchTerm} ${styleKeywords}`;
    }
  }
  
  // Clean up the search term
  searchTerm = searchTerm
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  
  console.log('Generated contextual search term:', searchTerm);
  return searchTerm;
};

const extractOccasionKeywords = (occasion: string): string => {
  const occasionLower = occasion.toLowerCase();
  
  if (occasionLower.includes('work') || occasionLower.includes('office') || occasionLower.includes('business')) {
    return 'business professional office';
  }
  if (occasionLower.includes('date') || occasionLower.includes('dinner') || occasionLower.includes('romantic')) {
    return 'date night elegant';
  }
  if (occasionLower.includes('casual') || occasionLower.includes('everyday') || occasionLower.includes('weekend')) {
    return 'casual comfortable everyday';
  }
  if (occasionLower.includes('party') || occasionLower.includes('event') || occasionLower.includes('celebration')) {
    return 'party dressy special occasion';
  }
  if (occasionLower.includes('formal') || occasionLower.includes('wedding') || occasionLower.includes('gala')) {
    return 'formal elegant special event';
  }
  if (occasionLower.includes('athletic') || occasionLower.includes('gym') || occasionLower.includes('workout')) {
    return 'athletic sporty active';
  }
  
  return '';
};

const extractStyleKeywords = (feedback: string, category: string): string => {
  const feedbackLower = feedback.toLowerCase();
  const keywords: string[] = [];
  
  // Color-related keywords
  if (feedbackLower.includes('color') || feedbackLower.includes('bright') || feedbackLower.includes('vibrant')) {
    keywords.push('colorful');
  }
  if (feedbackLower.includes('neutral') || feedbackLower.includes('muted')) {
    keywords.push('neutral');
  }
  
  // Style-related keywords
  if (feedbackLower.includes('professional') || feedbackLower.includes('polished')) {
    keywords.push('professional');
  }
  if (feedbackLower.includes('casual') || feedbackLower.includes('relaxed')) {
    keywords.push('casual');
  }
  if (feedbackLower.includes('structured') || feedbackLower.includes('tailored')) {
    keywords.push('structured');
  }
  if (feedbackLower.includes('comfortable') || feedbackLower.includes('soft')) {
    keywords.push('comfortable');
  }
  
  // Category-specific enhancements
  if (category === 'tops' && feedbackLower.includes('fitted')) {
    keywords.push('fitted');
  }
  if (category === 'shoes' && feedbackLower.includes('comfortable')) {
    keywords.push('comfortable walking');
  }
  
  return keywords.join(' ');
};
