
import { Gender, OccasionContext } from '@/context/RatingContext';
import { generateContextualSearchTerm } from './product/enhancedSearchGenerator';

export interface AmazonRegionConfig {
  domain: string;
  affiliateTag: string;
}

export const AMAZON_REGIONS: Record<string, AmazonRegionConfig> = {
  'UK': { domain: 'amazon.co.uk', affiliateTag: 'ratemyfit-21' },
  'US': { domain: 'amazon.com', affiliateTag: 'ratemyfitusa-20' },
  'AU': { domain: 'amazon.com.au', affiliateTag: 'ratemyfitaus-22' },
  'ES': { domain: 'amazon.es', affiliateTag: 'ratemyfit05-21' },
  'FR': { domain: 'amazon.fr', affiliateTag: 'ratemyfit06-21' },
  'DE': { domain: 'amazon.de', affiliateTag: 'ratemyfit09-21' },
  'IT': { domain: 'amazon.it', affiliateTag: 'ratemyfit0d-21' },
};

export const detectUserRegion = (): AmazonRegionConfig => {
  // Try to detect region from browser locale
  const locale = navigator.language || navigator.languages?.[0] || 'en-GB';
  
  if (locale.includes('en-US') || locale.includes('us')) {
    return AMAZON_REGIONS.US;
  } else if (locale.includes('en-AU') || locale.includes('au')) {
    return AMAZON_REGIONS.AU;
  } else if (locale.includes('es') || locale.includes('ES')) {
    return AMAZON_REGIONS.ES;
  } else if (locale.includes('fr') || locale.includes('FR')) {
    return AMAZON_REGIONS.FR;
  } else if (locale.includes('de') || locale.includes('DE')) {
    return AMAZON_REGIONS.DE;
  } else if (locale.includes('it') || locale.includes('IT')) {
    return AMAZON_REGIONS.IT;
  }
  
  // Default to UK
  return AMAZON_REGIONS.UK;
};

export const generateAmazonSearchUrl = (
  productName: string, 
  region?: AmazonRegionConfig, 
  gender?: Gender,
  occasionContext?: OccasionContext | null,
  feedback?: string,
  category?: string
): string => {
  const selectedRegion = region || detectUserRegion();
  
  console.log('Generating Amazon URL for product:', productName);
  
  // Start with the exact product name - this is key to preserving descriptive terms
  let searchTerms = productName;
  
  // Only use enhanced search generation for very specific occasions
  const hasVerySpecificOccasion = occasionContext?.eventContext && 
    !occasionContext.eventContext.toLowerCase().includes('neutral') &&
    !occasionContext.eventContext.toLowerCase().includes('general') &&
    occasionContext.eventContext.length > 10; // More specific occasions
  
  if (gender && category && hasVerySpecificOccasion) {
    console.log('Using enhanced search with very specific occasion context');
    searchTerms = generateContextualSearchTerm(productName, {
      occasion: occasionContext?.eventContext || undefined,
      feedback: feedback,
      userGender: gender,
      productCategory: category
    });
  } else {
    // Minimal processing - preserve the exact search term structure
    console.log('Using minimal processing to preserve exact product terms');
    
    // Only add gender prefix if it's absolutely not already there
    const lowerSearchTerms = searchTerms.toLowerCase();
    const hasGenderAlready = lowerSearchTerms.includes('mens') || 
                            lowerSearchTerms.includes('womens') || 
                            lowerSearchTerms.includes('men\'s') || 
                            lowerSearchTerms.includes('women\'s');
    
    if (gender && !hasGenderAlready) {
      const genderPrefix = gender === 'male' ? 'mens' : 'womens';
      searchTerms = `${genderPrefix} ${searchTerms}`;
    }
  }
  
  // Clean and encode the search terms
  const cleanedTerms = searchTerms
    .replace(/[^\w\s\-']/g, ' ') // Keep apostrophes and hyphens which are common in product names
    .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
    .trim()
    .replace(/\s/g, '+'); // Replace spaces with + for URL encoding
  
  const finalUrl = `https://www.${selectedRegion.domain}/s?k=${cleanedTerms}&tag=${selectedRegion.affiliateTag}&ref=sr_pg_1`;
  console.log('Final Amazon search URL:', finalUrl);
  console.log('Search terms used:', cleanedTerms);
  
  return finalUrl;
};
