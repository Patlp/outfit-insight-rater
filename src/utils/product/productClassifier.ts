
import { PRODUCT_ENHANCEMENTS } from './productEnhancements';

export const categorizeProduct = (productName: string): string => {
  const words = productName.toLowerCase().split(' ');
  
  for (const word of words) {
    if (PRODUCT_ENHANCEMENTS[word]) {
      return PRODUCT_ENHANCEMENTS[word].category;
    }
  }
  
  // Default categorization based on common patterns
  if (words.some(w => ['shoe', 'boot', 'sneaker', 'heel', 'flat', 'sandal'].includes(w))) {
    return 'footwear';
  }
  if (words.some(w => ['necklace', 'bracelet', 'watch', 'belt', 'bag', 'earring', 'scarf', 'hat'].includes(w))) {
    return 'accessories';
  }
  if (words.some(w => ['jacket', 'blazer', 'cardigan', 'coat'].includes(w))) {
    return 'outerwear';
  }
  if (words.some(w => ['shirt', 'blouse', 'top', 'tee'].includes(w))) {
    return 'tops';
  }
  if (words.some(w => ['pants', 'jeans', 'skirt', 'shorts'].includes(w))) {
    return 'bottoms';
  }
  if (words.some(w => ['dress'].includes(w))) {
    return 'dresses';
  }
  
  return 'fashion';
};

export const calculateConfidence = (productName: string, fullText: string): number => {
  let confidence = 0.5; // Base confidence
  
  // Boost confidence for known fashion terms
  const words = productName.toLowerCase().split(' ');
  if (words.some(word => Object.keys(PRODUCT_ENHANCEMENTS).includes(word))) {
    confidence += 0.3;
  }
  
  // Boost for specific colors or descriptors
  if (/\b(?:white|black|brown|blue|red|grey|gray|navy)\b/i.test(productName)) {
    confidence += 0.2;
  }
  
  // Boost for common fashion contexts
  if (/\b(?:wear|style|outfit|look|fashion)\b/i.test(fullText)) {
    confidence += 0.1;
  }
  
  // Reduce confidence for very short or generic terms
  if (productName.length < 4) {
    confidence -= 0.3;
  }
  
  // Reduce confidence for non-fashion words
  if (/\b(?:color|size|fit|wear|style|look)\b/i.test(productName)) {
    confidence -= 0.4;
  }
  
  return Math.max(0, Math.min(1, confidence));
};

export const cleanProductName = (text: string): string => {
  return text
    .replace(/\b(?:the|a|an|some|any|your|my|his|her|their)\b/gi, '')
    .replace(/\b(?:that|which|this|these|those)\b/gi, '')
    .replace(/\b(?:very|really|quite|pretty|so|too)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};
