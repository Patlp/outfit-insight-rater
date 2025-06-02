
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

export const generateAmazonSearchUrl = (productName: string, region?: AmazonRegionConfig): string => {
  const selectedRegion = region || detectUserRegion();
  const searchTerms = productName.replace(/\s+/g, '+').replace(/[^\w+]/g, '');
  
  return `https://www.${selectedRegion.domain}/s?k=${encodeURIComponent(searchTerms)}&tag=${selectedRegion.affiliateTag}`;
};
