
export const extractStyleRationale = (suggestion: string, item: string): string => {
  const lowerSuggestion = suggestion.toLowerCase();
  
  // Enhanced rationale detection with more patterns
  const rationaleMap = [
    { keywords: ['visual interest', 'add interest', 'more interesting', 'dynamic'], rationale: 'Visual Interest' },
    { keywords: ['professional', 'work', 'office', 'business', 'formal'], rationale: 'Professional Polish' },
    { keywords: ['color', 'coordinate', 'complement', 'palette', 'tone'], rationale: 'Color Coordination' },
    { keywords: ['proportion', 'balance', 'flattering', 'silhouette', 'shape'], rationale: 'Better Proportions' },
    { keywords: ['casual', 'relax', 'comfortable', 'laid-back', 'easy'], rationale: 'Casual Refinement' },
    { keywords: ['elevate', 'upgrade', 'polished', 'sophisticated', 'refined'], rationale: 'Style Elevation' },
    { keywords: ['texture', 'material', 'fabric', 'contrast', 'dimension'], rationale: 'Texture Balance' },
    { keywords: ['accessorize', 'complete', 'finishing touch', 'detail', 'accent'], rationale: 'Complete Look' },
    { keywords: ['structure', 'structured', 'tailored', 'fitted', 'sharp'], rationale: 'Structure Addition' },
    { keywords: ['layer', 'layering', 'depth', 'dimension', 'warmth'], rationale: 'Layer Addition' },
    { keywords: ['foundation', 'base', 'anchor', 'ground', 'establish'], rationale: 'Foundation Upgrade' },
    { keywords: ['versatile', 'adaptable', 'flexible', 'multi'], rationale: 'Versatility Boost' }
  ];

  // Check suggestion content for rationale
  for (const { keywords, rationale } of rationaleMap) {
    if (keywords.some(keyword => lowerSuggestion.includes(keyword))) {
      return rationale;
    }
  }
  
  // Item-based rationale as fallback
  const itemLower = item.toLowerCase();
  if (itemLower.includes('shoe') || itemLower.includes('sneaker') || itemLower.includes('boot')) {
    return 'Foundation Upgrade';
  }
  if (itemLower.includes('necklace') || itemLower.includes('bracelet') || itemLower.includes('earring') || itemLower.includes('watch') || itemLower.includes('belt')) {
    return 'Finishing Touch';
  }
  if (itemLower.includes('cardigan') || itemLower.includes('blazer') || itemLower.includes('jacket')) {
    return 'Layer Addition';
  }
  if (itemLower.includes('bag') || itemLower.includes('purse') || itemLower.includes('scarf')) {
    return 'Complete Look';
  }
  
  return 'Style Enhancement';
};
