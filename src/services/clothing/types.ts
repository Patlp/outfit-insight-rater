
export interface AIClothingItem {
  name: string;
  descriptors: string[];
  category: string;
  confidence: number;
  [key: string]: any; // Add index signature to make it compatible with Json type
}

export interface HybridExtractionResult {
  items: AIClothingItem[];
  method: 'ai' | 'regex' | 'hybrid' | 'enhanced';
  aiSuccess: boolean;
  regexFallbackUsed: boolean;
  enhancedMatchingUsed: boolean;
  aiItemCount: number;
  regexItemCount: number;
  enhancedItemCount: number;
  totalItemCount: number;
}

export interface ExtractionResponse {
  success: boolean;
  extractedItems?: AIClothingItem[];
  error?: string;
}

export interface HybridExtractionResponse {
  success: boolean;
  result?: HybridExtractionResult;
  error?: string;
}
