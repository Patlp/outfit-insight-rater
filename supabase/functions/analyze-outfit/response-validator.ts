
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

    // Check for incomplete sentences
    if (response.feedback.includes('..') || response.feedback.match(/\w\s*$/)) {
      warnings.push('Feedback may contain incomplete sentences');
    }

    // Check for proper section structure
    const expectedSections = ['Style', 'Color', 'Fit', 'Overall'];
    const hasSections = expectedSections.some(section => 
      response.feedback.includes(`**${section}`) || response.feedback.includes(`${section}:`)
    );
    if (!hasSections) {
      warnings.push('Feedback lacks expected section structure');
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

      // Check for list markers that weren't cleaned
      if (suggestion.match(/^\d+\.|^[-*]/)) {
        warnings.push(`Suggestion ${index + 1} still contains list markers`);
      }

      // Check for section headers in suggestions
      if (suggestion.match(/^(Style|Color|Fit|Suggestions?|Improvements?):/i)) {
        warnings.push(`Suggestion ${index + 1} contains section headers`);
      }
    });

    // Check for duplicate suggestions
    const uniqueSuggestions = new Set(response.suggestions);
    if (uniqueSuggestions.size < response.suggestions.length) {
      warnings.push('Duplicate suggestions detected');
    }
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
    // Double spaces
    /\s{2,}/,
    // Incomplete sentences (starts with lowercase after period)
    /\.\s+[a-z]/,
    // Missing periods at end of sentences (but allow ! and ?)
    /[a-zA-Z]\s*$/,
    // Repeated words
    /\b(\w+)\s+\1\b/i,
    // Malformed markdown
    /\*\*:\*\*|\*\*\s*\*\*/,
    // Standalone colons
    /\s:\s/,
    // Multiple punctuation
    /[.!?]{2,}/
  ];
  
  return grammarChecks.some(check => check.test(text));
}

export function assessFeedbackQuality(feedback: string): {
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let qualityScore = 100;

  // Check for section structure
  const expectedSections = ['Style', 'Color', 'Fit', 'Overall'];
  const foundSections = expectedSections.filter(section => 
    feedback.includes(`**${section}`) || feedback.includes(`${section}:`)
  );
  
  if (foundSections.length < 3) {
    issues.push('Missing expected section structure');
    qualityScore -= 20;
  }

  // Check for appropriate length
  if (feedback.length < 200) {
    issues.push('Feedback too brief');
    qualityScore -= 15;
  }

  // Check for grammar issues
  if (hasGrammarIssues(feedback)) {
    issues.push('Grammar or formatting issues detected');
    qualityScore -= 10;
  }

  // Check for meaningful content
  if (feedback.includes('good') > 3 || feedback.includes('nice') > 2) {
    issues.push('Feedback may be too generic');
    qualityScore -= 10;
  }

  return {
    score: Math.max(0, qualityScore),
    issues
  };
}
