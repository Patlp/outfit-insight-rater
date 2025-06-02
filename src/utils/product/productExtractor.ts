
import { Gender } from '@/context/RatingContext';
import { enhanceProductName } from './productEnhancements';
import { categorizeProduct, calculateConfidence, cleanProductName } from './productClassifier';

export interface ExtractedProduct {
  originalText: string;
  cleanedName: string;
  searchTerm: string;
  category: string;
  confidence: number;
}

const productRegexPatterns = [
  // Match "try a [product]" or "consider [product]"
  /(?:try|consider|add|wear|opt for|choose)\s+(?:a\s+|an\s+|some\s+)?([a-zA-Z\s]{2,25}?)(?:\s+(?:that|which|to|for)|\.|,|$)/gi,
  
  // Match "[product] would" or "[product] could"
  /([a-zA-Z\s]{2,25}?)\s+(?:would|could|might|will)\s+(?:help|improve|enhance|add|complement)/gi,
  
  // Match "a [product] in" or "some [product] with"
  /(?:a|an|some)\s+([a-zA-Z\s]{2,25}?)\s+(?:in|with|that|to)/gi,
  
  // Match direct suggestions like "white sneakers" or "black belt"
  /\b(?:white|black|brown|blue|red|grey|gray|dark|light|navy|beige|tan)\s+([a-zA-Z\s]{2,20}?)\b/gi,
  
  // Match size descriptors with products
  /\b(?:small|medium|large|oversized|fitted|loose|tight|slim)\s+([a-zA-Z\s]{2,20}?)\b/gi,
];

export const extractProductMentions = (text: string): ExtractedProduct[] => {
  const products: ExtractedProduct[] = [];
  const seenProducts = new Set<string>();
  
  // Clean the text
  const cleanText = text.toLowerCase()
    .replace(/[^\w\s.,!?-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Apply each regex pattern
  productRegexPatterns.forEach(pattern => {
    let match;
    pattern.lastIndex = 0; // Reset regex
    
    while ((match = pattern.exec(cleanText)) !== null && products.length < 6) {
      const extractedText = match[1]?.trim();
      if (!extractedText || extractedText.length < 3) continue;
      
      const cleaned = cleanProductName(extractedText);
      if (!cleaned || seenProducts.has(cleaned.toLowerCase())) continue;
      
      const confidence = calculateConfidence(cleaned, text);
      if (confidence < 0.3) continue;
      
      seenProducts.add(cleaned.toLowerCase());
      
      const enhanced = enhanceProductName(cleaned);
      const category = categorizeProduct(cleaned);
      
      products.push({
        originalText: extractedText,
        cleanedName: cleaned,
        searchTerm: enhanced,
        category,
        confidence
      });
    }
  });

  // Sort by confidence and return top 3
  return products
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
};
