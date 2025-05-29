
import { AnalyzeOutfitResponse, AnalyzeOutfitRequest } from './types.ts';
import { TextProcessor } from './text-processor.ts';
import { validateResponse, hasGrammarIssues } from './response-validator.ts';

export class AdvancedResponseParser {
  
  static parseAIResponse(aiResponse: string, request: AnalyzeOutfitRequest): AnalyzeOutfitResponse {
    console.log('Parsing AI response with advanced parser...');
    
    // First attempt: Try to parse the response normally
    let result = this.attemptBasicParsing(aiResponse, request);
    
    // Validate the result
    const validation = validateResponse(result);
    
    if (!validation.isValid || validation.warnings.length > 0) {
      console.log('Response validation failed, attempting enhanced parsing...');
      console.log('Errors:', validation.errors);
      console.log('Warnings:', validation.warnings);
      
      // Second attempt: Enhanced parsing with text processing
      result = this.attemptEnhancedParsing(aiResponse, request);
      
      // Final validation
      const finalValidation = validateResponse(result);
      if (!finalValidation.isValid) {
        console.log('Enhanced parsing also failed, using fallback content');
        result = this.generateFallbackResponse(request);
      }
    }
    
    // Final quality check and enhancement
    result = this.enhanceResponseQuality(result);
    
    console.log('Final parsed result:', JSON.stringify(result, null, 2));
    return result;
  }
  
  private static attemptBasicParsing(aiResponse: string, request: AnalyzeOutfitRequest): AnalyzeOutfitResponse {
    let score = 7;
    let feedback = aiResponse;
    let suggestions: string[] = [];

    // Extract score with multiple patterns
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
          score = parsedScore;
          break;
        }
      }
    }

    // Extract suggestions with improved patterns
    const suggestionPatterns = [
      /(Suggestions|Improvements|Recommendations|Tips):([\s\S]+?)(?:\n\n|\n[A-Z]|$)/i,
      /(?:^|\n)(?:\d+\.|[-*])\s*([^.\n]+\.)/gm
    ];
    
    for (const pattern of suggestionPatterns) {
      const matches = [...aiResponse.matchAll(new RegExp(pattern.source, pattern.flags))];
      if (matches.length > 0) {
        if (pattern.source.includes('Suggestions')) {
          // Handle section-based suggestions
          const suggestionsText = matches[0][2];
          suggestions = suggestionsText
            .split(/\n[0-9]+\.|\n-|\n\*/)
            .filter(item => item.trim().length > 10)
            .map(item => item.trim())
            .slice(0, 3);
        } else {
          // Handle individual suggestion matches
          suggestions = matches
            .map(match => match[1] ? match[1].trim() : match[0].trim())
            .filter(s => s.length > 10)
            .slice(0, 3);
        }
        break;
      }
    }

    // Clean feedback by removing score references and suggestion sections
    feedback = aiResponse
      .replace(/\b\d+\/10\b|\b\d+ out of 10\b|\bScore:?\s*\d+\b/gi, '')
      .replace(/(Suggestions|Improvements|Recommendations|Tips):[\s\S]+$/i, '')
      .trim();

    // If no suggestions found, generate fallback
    if (suggestions.length === 0) {
      const fallback = TextProcessor.generateFallbackContent(request);
      suggestions = fallback.suggestions;
    }

    return { score, feedback, suggestions };
  }
  
  private static attemptEnhancedParsing(aiResponse: string, request: AnalyzeOutfitRequest): AnalyzeOutfitResponse {
    // Use structured text processing
    const sections = TextProcessor.extractStructuredFeedback(aiResponse);
    
    let feedback = '';
    if (Object.keys(sections).length > 0) {
      feedback = TextProcessor.rebuildFeedbackFromSections(sections);
    } else {
      feedback = TextProcessor.cleanAndEnhanceText(aiResponse);
    }
    
    // Extract score with more aggressive parsing
    let score = 7;
    const allNumbers = aiResponse.match(/\d+/g);
    if (allNumbers) {
      for (const num of allNumbers) {
        const parsedNum = parseInt(num, 10);
        if (parsedNum >= 1 && parsedNum <= 10) {
          score = parsedNum;
          break;
        }
      }
    }
    
    // Extract and process suggestions
    let suggestions: string[] = [];
    const lines = aiResponse.split('\n');
    
    for (const line of lines) {
      const cleaned = line.trim();
      if (cleaned.length > 15 && 
          (cleaned.includes('consider') || cleaned.includes('try') || 
           cleaned.includes('add') || cleaned.includes('opt for') ||
           cleaned.match(/^\d+\./) || cleaned.match(/^[-*]/))) {
        suggestions.push(cleaned);
      }
    }
    
    suggestions = TextProcessor.formatSuggestions(suggestions).slice(0, 3);
    
    // Fallback if still no suggestions
    if (suggestions.length === 0) {
      const fallback = TextProcessor.generateFallbackContent(request);
      suggestions = fallback.suggestions;
    }
    
    return { score, feedback, suggestions };
  }
  
  private static generateFallbackResponse(request: AnalyzeOutfitRequest): AnalyzeOutfitResponse {
    console.log('Generating fallback response due to parsing failures');
    const fallback = TextProcessor.generateFallbackContent(request);
    
    return {
      score: 7,
      feedback: fallback.feedback,
      suggestions: fallback.suggestions
    };
  }
  
  private static enhanceResponseQuality(response: AnalyzeOutfitResponse): AnalyzeOutfitResponse {
    // Enhance feedback quality
    response.feedback = TextProcessor.cleanAndEnhanceText(response.feedback);
    
    // Check for grammar issues and clean if needed
    if (hasGrammarIssues(response.feedback)) {
      console.log('Grammar issues detected in feedback, applying additional cleaning');
      response.feedback = TextProcessor.cleanAndEnhanceText(response.feedback);
    }
    
    // Enhance suggestions quality
    response.suggestions = TextProcessor.formatSuggestions(response.suggestions);
    
    // Final validation and corrections
    response.suggestions = response.suggestions.filter(s => s.length > 5 && !hasGrammarIssues(s));
    
    // Ensure we have at least one suggestion
    if (response.suggestions.length === 0) {
      response.suggestions = ['Consider experimenting with different styling approaches to enhance your look.'];
    }
    
    return response;
  }
}
