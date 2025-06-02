
import { Gender } from '@/context/RatingContext';

export interface ExtractedProduct {
  originalText: string;
  cleanedName: string;
  searchTerm: string;
  category: string;
  confidence: number;
}

// Common fashion terms and their enhanced versions
const PRODUCT_ENHANCEMENTS: Record<string, { enhanced: string; category: string }> = {
  // Footwear
  'shoes': { enhanced: 'dress shoes', category: 'footwear' },
  'sneakers': { enhanced: 'white sneakers', category: 'footwear' },
  'boots': { enhanced: 'ankle boots', category: 'footwear' },
  'heels': { enhanced: 'block heels', category: 'footwear' },
  'flats': { enhanced: 'ballet flats', category: 'footwear' },
  'sandals': { enhanced: 'strappy sandals', category: 'footwear' },
  
  // Accessories
  'necklace': { enhanced: 'statement necklace', category: 'accessories' },
  'bracelet': { enhanced: 'gold bracelet', category: 'accessories' },
  'watch': { enhanced: 'leather watch', category: 'accessories' },
  'belt': { enhanced: 'leather belt', category: 'accessories' },
  'bag': { enhanced: 'crossbody bag', category: 'accessories' },
  'purse': { enhanced: 'structured handbag', category: 'accessories' },
  'earrings': { enhanced: 'stud earrings', category: 'accessories' },
  'scarf': { enhanced: 'silk scarf', category: 'accessories' },
  'hat': { enhanced: 'wide brim hat', category: 'accessories' },
  
  // Clothing
  'jacket': { enhanced: 'blazer jacket', category: 'outerwear' },
  'blazer': { enhanced: 'structured blazer', category: 'outerwear' },
  'cardigan': { enhanced: 'knit cardigan', category: 'outerwear' },
  'shirt': { enhanced: 'button down shirt', category: 'tops' },
  'blouse': { enhanced: 'silk blouse', category: 'tops' },
  'top': { enhanced: 'fitted top', category: 'tops' },
  'dress': { enhanced: 'midi dress', category: 'dresses' },
  'pants': { enhanced: 'tailored pants', category: 'bottoms' },
  'jeans': { enhanced: 'high waisted jeans', category: 'bottoms' },
  'skirt': { enhanced: 'midi skirt', category: 'bottoms' },
  'shorts': { enhanced: 'tailored shorts', category: 'bottoms' },
};

// Gender-specific search modifiers
const GENDER_MODIFIERS: Record<Gender, string> = {
  'male': 'mens',
  'female': 'womens'
};

export class TextProcessor {
  private static productRegexPatterns = [
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

  static extractProductMentions(text: string): ExtractedProduct[] {
    const products: ExtractedProduct[] = [];
    const seenProducts = new Set<string>();
    
    // Clean the text
    const cleanText = text.toLowerCase()
      .replace(/[^\w\s.,!?-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Apply each regex pattern
    this.productRegexPatterns.forEach(pattern => {
      let match;
      pattern.lastIndex = 0; // Reset regex
      
      while ((match = pattern.exec(cleanText)) !== null && products.length < 6) {
        const extractedText = match[1]?.trim();
        if (!extractedText || extractedText.length < 3) continue;
        
        const cleaned = this.cleanProductName(extractedText);
        if (!cleaned || seenProducts.has(cleaned.toLowerCase())) continue;
        
        const confidence = this.calculateConfidence(cleaned, text);
        if (confidence < 0.3) continue;
        
        seenProducts.add(cleaned.toLowerCase());
        
        const enhanced = this.enhanceProductName(cleaned);
        const category = this.categorizeProduct(cleaned);
        
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
  }

  private static cleanProductName(text: string): string {
    return text
      .replace(/\b(?:the|a|an|some|any|your|my|his|her|their)\b/gi, '')
      .replace(/\b(?:that|which|this|these|those)\b/gi, '')
      .replace(/\b(?:very|really|quite|pretty|so|too)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static enhanceProductName(productName: string): string {
    const words = productName.toLowerCase().split(' ');
    
    // Check if any word matches our enhancement dictionary
    for (const word of words) {
      if (PRODUCT_ENHANCEMENTS[word]) {
        return PRODUCT_ENHANCEMENTS[word].enhanced;
      }
    }
    
    // If no exact match, return the original with some common enhancements
    if (words.includes('shirt')) return 'button down shirt';
    if (words.includes('pants')) return 'tailored pants';
    if (words.includes('dress')) return 'midi dress';
    
    return productName;
  }

  private static categorizeProduct(productName: string): string {
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
  }

  private static calculateConfidence(productName: string, fullText: string): number {
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
  }

  static createGenderSpecificSearchTerm(productTerm: string, gender: Gender): string {
    const genderModifier = GENDER_MODIFIERS[gender];
    return `${genderModifier} ${productTerm}`;
  }
}
