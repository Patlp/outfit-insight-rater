
import { AnalyzeOutfitResponse, AnalyzeOutfitRequest } from './types.ts';

export function parseAIResponse(aiResponse: string, request: AnalyzeOutfitRequest): AnalyzeOutfitResponse {
  let score = 7; // Default score if parsing fails
  let feedback = aiResponse;
  let suggestions: string[] = [];

  // Try to extract score (look for numbers followed by /10 or out of 10)
  const scoreMatch = aiResponse.match(/(\d+)(?:\s*\/\s*10|(?:\s+out\s+of|\s+on\s+a\s+scale\s+of)\s+10)/i);
  if (scoreMatch) {
    score = parseInt(scoreMatch[1], 10);
  }

  // Try to extract suggestions (look for numbered lists or bullet points)
  const suggestionsPattern = /(Suggestions|Improvements|Recommendations|Tips):([\s\S]+?)(?:\n\n|\n[A-Z]|$)/i;
  const suggestionsMatch = aiResponse.match(suggestionsPattern);
  
  if (suggestionsMatch) {
    const suggestionsText = suggestionsMatch[2];
    suggestions = suggestionsText
      .split(/\n[0-9]+\.|\n-|\n\*/)
      .filter(item => item.trim().length > 0)
      .map(item => item.trim())
      .slice(0, 3); // Limit to 3 suggestions
  }
  
  if (suggestions.length === 0) {
    // Fallback: try to find sentences with suggestion keywords
    const possibleSuggestions = aiResponse
      .split(/\.|\n/)
      .filter(s => 
        /suggest|try|consider|add|improve|change|update|opt for|choose|pair with/i.test(s)
      )
      .map(s => s.trim())
      .filter(s => s.length > 15);
    
    suggestions = possibleSuggestions.slice(0, 3);
  }

  // Extract feedback (everything that's not the score or suggestions)
  feedback = aiResponse.replace(/\b\d+\/10\b|\b\d+ out of 10\b|\bScore:?\s*\d+\b/g, "")
                      .replace(/(Suggestions|Improvements|Recommendations|Tips):[\s\S]+$/i, "")
                      .trim();

  // Provide fallback suggestions if none were found
  if (suggestions.length === 0) {
    suggestions = generateFallbackSuggestions(request);
  }

  return {
    score,
    feedback,
    suggestions
  };
}

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
