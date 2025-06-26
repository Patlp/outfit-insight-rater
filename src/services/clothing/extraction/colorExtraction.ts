
// Color extraction and context preservation utilities

interface ColorExtractionResult {
  preservedName: string; // Keep original name with color
  extractedColor: string;
  colorConfidence: number;
  cleanItemName: string; // Clean name without color for categorization
  fullDescription: string;
}

// Enhanced color extraction that PRESERVES original context
export const extractAndPreserveColorContext = (itemName: string): ColorExtractionResult => {
  const originalName = itemName.trim();
  const lowerName = originalName.toLowerCase();
  
  // Define comprehensive color mapping with fashion-specific terms
  const colorPatterns = {
    // Blacks
    'black': ['black', 'jet black', 'midnight black', 'charcoal black'],
    'charcoal': ['charcoal', 'dark gray', 'anthracite', 'charcoal gray'],
    
    // Whites  
    'white': ['white', 'pure white', 'snow white'],
    'cream': ['cream', 'ivory', 'off-white', 'pearl white', 'eggshell', 'bone white'],
    
    // Blues
    'navy blue': ['navy', 'navy blue', 'dark navy', 'midnight blue'],
    'royal blue': ['royal blue', 'cobalt blue', 'electric blue'],
    'sky blue': ['sky blue', 'light blue', 'powder blue', 'baby blue'],
    'denim blue': ['denim', 'denim blue', 'jean blue', 'indigo'],
    'teal': ['teal', 'teal blue', 'turquoise'],
    
    // Reds
    'burgundy': ['burgundy', 'wine red', 'maroon', 'deep red'],
    'crimson': ['crimson', 'cherry red', 'bright red', 'fire red'],
    'brick red': ['brick red', 'rust red', 'terracotta'],
    
    // Greens
    'forest green': ['forest green', 'dark green', 'hunter green'],
    'olive green': ['olive', 'olive green', 'military green', 'khaki green'],
    'emerald green': ['emerald', 'emerald green', 'jade green'],
    'sage green': ['sage', 'sage green', 'mint green', 'seafoam'],
    
    // Browns
    'chocolate brown': ['chocolate', 'chocolate brown', 'dark brown', 'espresso'],
    'tan': ['tan', 'beige', 'sand', 'camel brown'],
    'camel': ['camel', 'cognac', 'cognac brown', 'honey brown'],
    
    // Grays
    'light gray': ['light gray', 'light grey', 'heather gray', 'silver gray'],
    'stone gray': ['stone gray', 'stone grey', 'slate gray', 'pewter'],
    
    // Pinks
    'blush pink': ['blush', 'blush pink', 'dusty pink', 'rose pink'],
    'hot pink': ['hot pink', 'bright pink', 'fuchsia', 'magenta'],
    'rose pink': ['rose', 'rose pink', 'dusty rose', 'mauve'],
    
    // Purples
    'deep purple': ['purple', 'deep purple', 'plum', 'eggplant'],
    'lavender': ['lavender', 'light purple', 'violet', 'lilac'],
    
    // Yellows
    'mustard yellow': ['mustard', 'mustard yellow', 'ochre'],
    'golden yellow': ['golden', 'golden yellow', 'gold', 'amber'],
    'pale yellow': ['pale yellow', 'cream yellow', 'butter yellow'],
    
    // Oranges
    'burnt orange': ['burnt orange', 'rust orange', 'copper'],
    'coral': ['coral', 'peach', 'salmon', 'apricot'],
  };

  // Find the best color match while preserving context
  let bestMatch = '';
  let bestConfidence = 0;
  let matchedPhrase = '';

  for (const [standardColor, variations] of Object.entries(colorPatterns)) {
    for (const variation of variations) {
      if (lowerName.includes(variation)) {
        const confidence = variation.length / lowerName.length; // Longer matches = higher confidence
        if (confidence > bestConfidence) {
          bestMatch = standardColor;
          bestConfidence = confidence;
          matchedPhrase = variation;
        }
      }
    }
  }

  // If no specific color found, try basic colors
  if (!bestMatch) {
    const basicColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey'];
    for (const color of basicColors) {
      if (lowerName.includes(color)) {
        bestMatch = color;
        bestConfidence = 0.5;
        matchedPhrase = color;
        break;
      }
    }
  }

  // Create clean item name for categorization (remove color)
  const cleanItemName = matchedPhrase 
    ? originalName.replace(new RegExp(matchedPhrase, 'gi'), '').trim()
    : originalName;

  return {
    preservedName: originalName, // KEEP ORIGINAL WITH COLOR
    extractedColor: bestMatch || 'neutral',
    colorConfidence: bestConfidence,
    cleanItemName: cleanItemName || originalName,
    fullDescription: originalName
  };
};
