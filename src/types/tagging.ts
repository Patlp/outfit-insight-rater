
export type TaggingLevel = 'basic' | 'medium' | 'advanced';

export interface TaggingConfig {
  level: TaggingLevel;
  useAIExtraction: boolean;
  useEnhancedMatching: boolean;
  useKaggleData: boolean;
  maxItems: number;
  minConfidence: number;
}

export interface TaggingResult {
  level: TaggingLevel;
  itemCount: number;
  averageConfidence: number;
  extractionMethod: string;
  processingTime?: number;
}

export const TAGGING_CONFIGS: Record<TaggingLevel, TaggingConfig> = {
  basic: {
    level: 'basic',
    useAIExtraction: false,
    useEnhancedMatching: false,
    useKaggleData: false,
    maxItems: 3,
    minConfidence: 0.5
  },
  medium: {
    level: 'medium',
    useAIExtraction: true,
    useEnhancedMatching: false,
    useKaggleData: false,
    maxItems: 5,
    minConfidence: 0.7
  },
  advanced: {
    level: 'advanced',
    useAIExtraction: true,
    useEnhancedMatching: true,
    useKaggleData: true,
    maxItems: 8,
    minConfidence: 0.6
  }
};
