
export const generateContextualDescription = (category: string, suggestionText: string): string => {
  const lowerText = suggestionText.toLowerCase();
  
  // Context-aware descriptions based on the suggestion content
  if (lowerText.includes('professional') || lowerText.includes('work')) {
    return 'This piece will enhance your professional appearance and boost confidence in workplace settings.';
  }
  
  if (lowerText.includes('visual interest') || lowerText.includes('interest')) {
    return 'Adding this will create visual interest and prevent your outfit from looking too plain or monotonous.';
  }
  
  if (lowerText.includes('color') || lowerText.includes('coordinate')) {
    return 'This piece will help coordinate your color palette and create a more cohesive, intentional look.';
  }
  
  if (lowerText.includes('proportion') || lowerText.includes('balance')) {
    return 'This will help balance your proportions and create a more flattering overall silhouette.';
  }
  
  // Default descriptions by category
  const defaultDescriptions: Record<string, string> = {
    footwear: 'The right shoes can completely transform your look and provide the perfect foundation.',
    accessories: 'Strategic accessories add personality and polish to elevate your entire outfit.',
    outerwear: 'A well-chosen outer layer adds structure and sophistication to your style.',
    tops: 'The right top creates a strong foundation for your overall look.',
    bottoms: 'Well-fitted bottoms are essential for a polished, put-together appearance.',
    dresses: 'The perfect dress makes getting dressed effortless while looking effortlessly chic.',
    fashion: 'This piece will complement your personal style perfectly.'
  };
  
  return defaultDescriptions[category] || defaultDescriptions.fashion;
};
