
import { AnalyzeOutfitResponse } from './types.ts';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateResponse(response: AnalyzeOutfitResponse): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate score
  if (response.score < 1 || response.score > 10 || !Number.isInteger(response.score)) {
    errors.push('Score must be an integer between 1 and 10');
  }

  // Validate feedback
  if (!response.feedback || response.feedback.trim().length < 20) {
    errors.push('Feedback must be at least 20 characters long');
  }

  // Check for common formatting issues in feedback
  if (response.feedback) {
    if (response.feedback.includes('**:**') || response.feedback.includes('****')) {
      warnings.push('Malformed markdown formatting detected in feedback');
    }
    
    if (response.feedback.match(/^[A-Z][a-z]*:$/m)) {
      warnings.push('Standalone section headers detected in feedback');
    }
  }

  // Validate suggestions
  if (!response.suggestions || response.suggestions.length === 0) {
    errors.push('At least one suggestion is required');
  }

  if (response.suggestions) {
    response.suggestions.forEach((suggestion, index) => {
      if (!suggestion || suggestion.trim().length < 10) {
        errors.push(`Suggestion ${index + 1} is too short or empty`);
      }
      
      // Check for formatting issues
      if (suggestion.includes('**:**') || suggestion.startsWith('**') && !suggestion.includes('**', 2)) {
        warnings.push(`Suggestion ${index + 1} has malformed formatting`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function hasGrammarIssues(text: string): boolean {
  if (!text) return true;
  
  // Check for basic grammar issues
  const grammarChecks = [
    // Missing articles before nouns
    /\b(is|are|was|were)\s+[a-z]+ing\b/i,
    // Double spaces
    /\s{2,}/,
    // Incomplete sentences (starts with lowercase after period)
    /\.\s+[a-z]/,
    // Missing periods at end of sentences
    /[a-zA-Z]\s*$/,
    // Repeated words
    /\b(\w+)\s+\1\b/i
  ];
  
  return grammarChecks.some(check => check.test(text));
}
