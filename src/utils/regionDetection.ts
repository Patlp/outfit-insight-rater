
import { Gender, OccasionContext } from '@/context/RatingContext';

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
  searchTerm: string, 
  region?: AmazonRegionConfig, 
  gender?: Gender,
  occasionContext?: OccasionContext | null,
  feedback?: string,
  category?: string
): string => {
  const selectedRegion = region || detectUserRegion();
  
  // Use the search term as-is since it's now generated with proper attributes
  let finalSearchTerms = searchTerm;
  
  // Clean and encode the search terms
  const cleanedTerms = finalSearchTerms
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '+');
  
  const finalUrl = `https://www.${selectedRegion.domain}/s?k=${encodeURIComponent(cleanedTerms)}&tag=${selectedRegion.affiliateTag}&ref=sr_pg_1`;
  
  console.log('Generated Amazon search URL:', finalUrl);
  console.log('Search terms used:', cleanedTerms);
  
  return finalUrl;
};
