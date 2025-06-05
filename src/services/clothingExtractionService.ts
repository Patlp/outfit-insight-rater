
// Main clothing extraction service - simplified and focused
export { AIClothingItem, HybridExtractionResult } from './clothing/types';
export { extractClothingPhrasesAI } from './clothing/aiExtraction';
export { extractClothingPhrasesHybrid } from './clothing/hybridExtractor';
export { getExtractedClothingItems } from './clothing/dataRetrieval';

// Re-export for backward compatibility
import { extractClothingPhrasesHybrid } from './clothing/hybridExtractor';
import { extractClothingPhrasesAI } from './clothing/aiExtraction';
import { getExtractedClothingItems } from './clothing/dataRetrieval';

// Default export maintains the hybrid extraction as the primary function
export {
  extractClothingPhrasesHybrid as default,
  extractClothingPhrasesAI,
  getExtractedClothingItems
};
