
import { ExtractedTerminology, ExtractedPrinciple, ExtractedMaterial } from './types';

export const generateMockTerminology = (): ExtractedTerminology[] => [
  {
    term: 'silhouette',
    category: 'descriptor',
    definition: 'The overall shape or outline of a garment when worn',
    synonyms: ['outline', 'shape', 'form', 'contour'],
    related_terms: ['fit', 'cut', 'drape', 'structure'],
    usage_context: 'Describes the overall visual impression and shape of clothing',
    confidence_score: 0.95
  },
  {
    term: 'drape',
    category: 'technique',
    definition: 'How fabric falls and hangs naturally on the body',
    synonyms: ['fall', 'hang', 'flow'],
    related_terms: ['silhouette', 'fabric weight', 'fit', 'bias'],
    usage_context: 'Technical term for fabric behavior and movement',
    confidence_score: 0.90
  },
  {
    term: 'tailoring',
    category: 'technique',
    definition: 'The art and craft of constructing fitted garments',
    synonyms: ['sartorial construction', 'bespoke', 'custom fitting'],
    related_terms: ['fit', 'construction', 'craftsmanship', 'alterations'],
    usage_context: 'Professional garment construction and fitting techniques',
    confidence_score: 0.98
  },
  {
    term: 'bias cut',
    category: 'technique',
    definition: 'Cutting fabric diagonally across the grain for enhanced drape',
    synonyms: ['diagonal cut', 'cross-grain cut'],
    related_terms: ['drape', 'grain', 'stretch', 'fit'],
    usage_context: 'Advanced cutting technique for improved garment movement',
    confidence_score: 0.88
  },
  {
    term: 'color blocking',
    category: 'style',
    definition: 'Using distinct blocks of solid colors in garment design',
    synonyms: ['color contrast', 'geometric color'],
    related_terms: ['color theory', 'visual impact', 'proportion'],
    usage_context: 'Design technique for creating visual interest through color',
    confidence_score: 0.92
  },
  {
    term: 'layering',
    category: 'style',
    definition: 'Wearing multiple garments in combination for style or function',
    synonyms: ['stratification', 'multi-piece styling'],
    related_terms: ['proportion', 'texture', 'seasonal dressing'],
    usage_context: 'Styling technique for versatility and visual depth',
    confidence_score: 0.87
  }
];

export const generateMockPrinciples = (): ExtractedPrinciple[] => [
  {
    principle_name: 'Color Harmony and Balance',
    description: 'Colors should work together to create visual balance and pleasing aesthetic combinations',
    category: 'color_theory',
    applicable_items: ['shirt', 'pants', 'accessories', 'outerwear'],
    academic_evidence: 'Based on color wheel theory, complementary color relationships, and visual perception studies',
    confidence_score: 0.94
  },
  {
    principle_name: 'Proportional Balance',
    description: 'Garment proportions should complement and enhance body proportions for optimal fit',
    category: 'fit_guidelines',
    applicable_items: ['tops', 'bottoms', 'outerwear', 'dresses'],
    academic_evidence: 'Derived from anthropometric studies and proportion theory in fashion design',
    confidence_score: 0.91
  },
  {
    principle_name: 'Occasion Appropriateness',
    description: 'Clothing choices should align with social context, formality level, and cultural norms',
    category: 'occasion_matching',
    applicable_items: ['formal wear', 'casual wear', 'business attire', 'evening wear'],
    academic_evidence: 'Supported by sociological studies on dress codes and social perception',
    confidence_score: 0.89
  },
  {
    principle_name: 'Seasonal Color Adaptation',
    description: 'Color choices should reflect seasonal trends and psychological associations',
    category: 'color_theory',
    applicable_items: ['seasonal collections', 'outerwear', 'accessories'],
    academic_evidence: 'Based on seasonal affective research and fashion trend analysis',
    confidence_score: 0.86
  }
];

export const generateMockMaterials = (): ExtractedMaterial[] => [
  {
    material_name: 'Cotton',
    material_type: 'natural_fiber',
    properties: {
      breathability: 'high',
      durability: 'high',
      stretch: 'low',
      moisture_absorption: 'high',
      care_difficulty: 'low'
    },
    seasonal_appropriateness: ['spring', 'summer'],
    typical_uses: ['casual wear', 'undergarments', 'shirts'],
    confidence_score: 0.95
  },
  {
    material_name: 'Wool',
    material_type: 'natural_fiber',
    properties: {
      insulation: 'high',
      breathability: 'medium',
      durability: 'high',
      water_resistance: 'medium',
      care_difficulty: 'medium'
    },
    seasonal_appropriateness: ['autumn', 'winter'],
    typical_uses: ['outerwear', 'sweaters', 'formal wear'],
    confidence_score: 0.93
  }
];
