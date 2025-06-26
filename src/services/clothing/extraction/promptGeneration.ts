
// Context-aware prompt generation for AI image generation

import { extractAndPreserveColorContext } from './colorExtraction';

// Generate context-aware prompts that preserve original analysis
export const generateContextAwarePrompt = (
  itemName: string,
  category: string,
  originalImageUrl?: string
): string => {
  const colorResult = extractAndPreserveColorContext(itemName);
  const { preservedName, extractedColor, colorConfidence } = colorResult;
  
  // Build prompt that preserves the original context
  let prompt = `Professional product photography of a "${preservedName}"`;
  
  // Add color emphasis if confidence is high
  if (colorConfidence > 0.3 && extractedColor !== 'neutral') {
    prompt += `, emphasizing the ${extractedColor} color accuracy`;
  }
  
  // Add category-specific styling
  const categoryStyles: Record<string, string> = {
    'tops': 'with natural drape and fabric flow, floating presentation',
    'bottoms': 'with proper fit and structure, natural garment shape',
    'dresses': 'with elegant silhouette and natural drape, full-length view',
    'outerwear': 'with structured tailoring and professional finish',
    'footwear': 'with authentic material texture and finish, 3/4 angle view',
    'accessories': 'with premium material quality and craftsmanship, optimal angle'
  };
  
  const categoryStyle = categoryStyles[category.toLowerCase()] || 'with professional presentation';
  prompt += `, ${categoryStyle}`;
  
  // Add technical specifications for color accuracy
  prompt += ', floating with invisible support on pure white seamless background';
  prompt += ', professional studio lighting with accurate color representation';
  prompt += ', high resolution product photography maintaining exact color fidelity';
  prompt += ', clean isolated presentation with no shadows or reflections';
  
  // Add reference context if available
  if (originalImageUrl) {
    prompt += ', matching the style and color accuracy of the original garment';
  }
  
  // Add negative prompt for accuracy
  const negativePrompt = `no mannequin, no model, no person, no background elements, no additional clothing, no accessories, no shadows, no logos, no color distortion, maintain exact ${extractedColor} color tone as described`;
  
  return `${prompt}\n\nNEGATIVE PROMPT: ${negativePrompt}`;
};
