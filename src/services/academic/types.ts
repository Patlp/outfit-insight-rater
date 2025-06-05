
export interface ProcessingResult {
  success: boolean;
  processedCount: number;
  errors: string[];
  extractedData: {
    terminology: number;
    principles: number;
    categories: number;
    materials: number;
  };
}

export interface ExtractedTerminology {
  term: string;
  category: 'clothing_item' | 'descriptor' | 'material' | 'color' | 'style' | 'technique';
  definition?: string;
  synonyms?: string[];
  related_terms?: string[];
  usage_context?: string;
  confidence_score: number;
}

export interface ExtractedPrinciple {
  principle_name: string;
  description: string;
  category: 'color_theory' | 'fit_guidelines' | 'occasion_matching' | 'body_type' | 'seasonal';
  applicable_items: string[];
  academic_evidence?: string;
  confidence_score: number;
}

export interface ExtractedMaterial {
  material_name: string;
  material_type: string;
  properties: {
    breathability?: string;
    durability?: string;
    stretch?: string;
    moisture_absorption?: string;
    care_difficulty?: string;
    insulation?: string;
    water_resistance?: string;
  };
  seasonal_appropriateness: string[];
  typical_uses: string[];
  confidence_score: number;
}
