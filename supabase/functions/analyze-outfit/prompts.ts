
import { AnalyzeOutfitRequest } from './types.ts';
import { generateEnhancedSystemMessage } from './enhanced-prompts.ts';

export function generateSystemMessage(request: AnalyzeOutfitRequest): string {
  console.log('Using enhanced prompts for improved AI feedback quality');
  return generateEnhancedSystemMessage(request);
}
