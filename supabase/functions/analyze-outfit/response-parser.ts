import { AnalyzeOutfitResponse, AnalyzeOutfitRequest } from './types.ts';
import { AdvancedResponseParser } from './advanced-parser.ts';

export function parseAIResponse(aiResponse: string, request: AnalyzeOutfitRequest): AnalyzeOutfitResponse {
  return AdvancedResponseParser.parseAIResponse(aiResponse, request);
}

// Keep the original function for backwards compatibility but redirect to advanced parser
function generateFallbackSuggestions(request: AnalyzeOutfitRequest): string[] {
  const { eventContext, isNeutral } = request;
  
  return [
    eventContext && !isNeutral 
      ? `Consider adjusting your outfit to better suit "${eventContext}".`
      : "Consider adjusting the fit for better proportions.",
    eventContext && !isNeutral 
      ? `Choose colors that are more appropriate for "${eventContext}".`
      : "Try experimenting with complementary color combinations.",
    eventContext && !isNeutral 
      ? `Add accessories that enhance your look for "${eventContext}".`
      : "Adding a statement accessory could elevate this look."
  ];
}
