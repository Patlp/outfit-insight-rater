
// Main clothing extraction service - now using real AI-powered analysis
export type { AIClothingItem, HybridExtractionResult } from './clothing/types';
export { extractClothingPhrasesAI } from './clothing/aiExtraction';
export { extractClothingPhrasesHybrid } from './clothing/hybridExtractor';
export { getExtractedClothingItems } from './clothing/dataRetrieval';

// Real AI-powered clothing extraction as the primary function
export { extractClothingFromImage as default } from './clothing/extraction/clothingExtractionService';

// Legacy hybrid extraction maintained for text-only analysis
export { extractClothingPhrasesHybrid as extractClothingPhrasesLegacy } from './clothing/hybridExtractor';
