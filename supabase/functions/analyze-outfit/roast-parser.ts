import { AnalyzeOutfitResponse, AnalyzeOutfitRequest } from './types.ts';

export class RoastModeParser {
  
  static parseRoastResponse(aiResponse: string, request: AnalyzeOutfitRequest): AnalyzeOutfitResponse {
    console.log('🔥 ROAST MODE PARSER: Processing brutal feedback...');
    
    // For roast mode, we want to preserve the AI's raw brutality
    // Minimal processing to keep the savage content intact
    
    let score = 3; // Default low score for roast mode
    let feedback = aiResponse;
    let suggestions: string[] = [];

    // Extract score - but for roast mode, bias toward lower scores
    const scorePatterns = [
      /(\d+)(?:\s*\/\s*10|(?:\s+out\s+of|\s+on\s+a\s+scale\s+of)\s+10)/i,
      /(?:score|rating):\s*(\d+)/i,
      /\b(\d+)\s*\/\s*10\b/i
    ];
    
    for (const pattern of scorePatterns) {
      const match = aiResponse.match(pattern);
      if (match) {
        const parsedScore = parseInt(match[1], 10);
        if (parsedScore >= 1 && parsedScore <= 10) {
          // For roast mode, cap scores at 6 to maintain brutality
          score = Math.min(parsedScore, 6);
          break;
        }
      }
    }

    // For roast mode, DON'T clean the feedback - preserve the brutality
    feedback = aiResponse
      .replace(/\b\d+\/10\b|\b\d+ out of 10\b|\bScore:?\s*\d+\b/gi, '')
      .trim();

    // Extract suggestions but keep them brutal
    const suggestionPatterns = [
      /(SUGGESTIONS|Improvements|Tips):([\s\S]+?)(?:\n\n|\n[A-Z]|$)/i,
      /\d+\.\s*([^.\n]+(?:\.[^.\n]*)*)/g
    ];

    for (const pattern of suggestionPatterns) {
      const matches = feedback.match(pattern);
      if (matches) {
        if (pattern.global) {
          // Handle numbered suggestions
          suggestions = Array.from(feedback.matchAll(/\d+\.\s*([^.\n]+(?:\.[^.\n]*)*)/g))
            .map(match => match[1].trim())
            .filter(s => s.length > 10)
            .slice(0, 3);
        } else {
          // Handle suggestion section
          const suggestionsText = matches[2];
          suggestions = suggestionsText
            .split(/\n\d+\.|\n-|\n\*/)
            .filter(item => item.trim().length > 10)
            .map(item => item.trim())
            .slice(0, 3);
        }
        break;
      }
    }

    // Remove suggestion section from feedback to avoid duplication
    feedback = feedback.replace(/(SUGGESTIONS|Improvements|Tips):[\s\S]+$/i, '').trim();

    // Fallback brutal suggestions if none found
    if (suggestions.length === 0) {
      suggestions = this.generateBrutalFallbackSuggestions(request);
    }

    // Ensure feedback is brutal enough - if it's too nice, make it meaner
    if (this.isTooNice(feedback)) {
      feedback = this.makeBrutal(feedback, request);
    }

    console.log('🔥 ROAST PARSER COMPLETE - Brutality preserved!');
    return { score, feedback, suggestions };
  }

  private static isTooNice(feedback: string): boolean {
    const niceWords = [
      'nice', 'good', 'okay', 'decent', 'fine', 'pleasant', 'lovely', 
      'acceptable', 'appropriate', 'suitable', 'workable', 'pretty'
    ];
    
    const lowerFeedback = feedback.toLowerCase();
    const niceWordCount = niceWords.filter(word => lowerFeedback.includes(word)).length;
    
    // If more than 2 nice words, it's too nice for roast mode
    return niceWordCount > 2 || feedback.length < 200;
  }

  private static makeBrutal(feedback: string, request: AnalyzeOutfitRequest): string {
    const { gender } = request;
    
    const brutalPrefixes = [
      "Oh honey, NO. This outfit is a complete disaster.",
      "I'm genuinely concerned for your eyesight because this is TRAGIC.",
      "This looks like you got dressed in a tornado during a blackout.",
      "Did you lose a bet or is this your actual fashion sense?",
      "This outfit screams 'I've given up on life and style.'"
    ];

    const randomPrefix = brutalPrefixes[Math.floor(Math.random() * brutalPrefixes.length)];
    
    return `${randomPrefix}\n\n${feedback}\n\nSeriously, this needs a complete overhaul. Every single piece is working against you here.`;
  }

  private static generateBrutalFallbackSuggestions(request: AnalyzeOutfitRequest): string[] {
    const { gender } = request;
    
    const brutalSuggestions = [
      "Burn this outfit and start completely over - there's no saving this disaster",
      "Hire a stylist immediately, or at least ask a fashionable friend for help because this ain't it",
      "Study some fashion magazines before leaving the house again - this is a public service announcement"
    ];

    return brutalSuggestions;
  }
}
