import { AnalyzeOutfitRequest } from './types.ts';
import { generateEnhancedSystemMessage } from './enhanced-prompts.ts';

export function generateSystemMessage(request: AnalyzeOutfitRequest): string {
  return generateEnhancedSystemMessage(request);
}

// Keep legacy functions for backwards compatibility but mark as deprecated
function generateDefaultRoastPrompt(gender: string): string {
  console.warn('Using deprecated prompt function, consider updating to enhanced prompts');
  return generateEnhancedSystemMessage({ gender, feedbackMode: 'roast', isNeutral: true } as AnalyzeOutfitRequest);
}

function generateOccasionSpecificRoastPrompt(gender: string, eventContext: string): string {
  console.warn('Using deprecated prompt function, consider updating to enhanced prompts');
  return generateEnhancedSystemMessage({ gender, feedbackMode: 'roast', eventContext, isNeutral: false } as AnalyzeOutfitRequest);
}

function generateDefaultNormalPrompt(gender: string): string {
  console.warn('Using deprecated prompt function, consider updating to enhanced prompts');
  return generateEnhancedSystemMessage({ gender, feedbackMode: 'normal', isNeutral: true } as AnalyzeOutfitRequest);
}

function generateOccasionSpecificNormalPrompt(gender: string, eventContext: string): string {
  console.warn('Using deprecated prompt function, consider updating to enhanced prompts');
  return generateEnhancedSystemMessage({ gender, feedbackMode: 'normal', eventContext, isNeutral: false } as AnalyzeOutfitRequest);
}
