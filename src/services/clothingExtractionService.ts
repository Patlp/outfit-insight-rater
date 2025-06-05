
// Main clothing extraction service - simplified and focused
export type { AIClothingItem, HybridExtractionResult } from './clothing/types';
export { extractClothingPhrasesAI } from './clothing/aiExtraction';
export { extractClothingPhrasesHybrid } from './clothing/hybridExtractor';
export { getExtractedClothingItems } from './clothing/dataRetrieval';

// Default export maintains the hybrid extraction as the primary function
export { extractClothingPhrasesHybrid as default } from './clothing/hybridExtractor';
