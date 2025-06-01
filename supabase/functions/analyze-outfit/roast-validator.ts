
import { AnalyzeOutfitResponse } from './types.ts';

export interface RoastValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  brutalityScore: number;
}

export function validateRoastResponse(response: AnalyzeOutfitResponse): RoastValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let brutalityScore = 0;

  // Validate score (roast mode should typically be lower)
  if (response.score < 1 || response.score > 10 || !Number.isInteger(response.score)) {
    errors.push('Score must be an integer between 1 and 10');
  } else if (response.score > 6) {
    warnings.push('Score seems too high for roast mode - should typically be 6 or lower');
  }

  // Validate feedback exists and is substantial
  if (!response.feedback || response.feedback.trim().length < 50) {
    errors.push('Roast feedback must be substantial (at least 50 characters)');
  }

  // Check for brutality indicators in feedback
  if (response.feedback) {
    const brutalWords = [
      'disaster', 'tragic', 'awful', 'terrible', 'horrible', 'devastating', 'catastrophe',
      'nightmare', 'mess', 'embarrassing', 'pathetic', 'atrocious', 'appalling', 'hideous',
      'offensive', 'crime', 'assault', 'torture', 'punishment', 'violation', 'abuse',
      'savage', 'brutal', 'merciless', 'ruthless', 'vicious', 'cruel', 'harsh'
    ];

    const sarcasmIndicators = [
      'oh wow', 'congratulations', 'amazing', 'brilliant', 'genius', 'fantastic',
      'wonderful', 'perfect', 'exactly', 'sure', 'definitely', 'absolutely'
    ];

    const mockingPhrases = [
      'did you', 'lose a bet', 'get dressed', 'in the dark', 'with your eyes closed',
      'what were you thinking', 'seriously', 'honestly', 'really', 'come on'
    ];

    const lowerFeedback = response.feedback.toLowerCase();
    
    // Count brutal words
    const brutalWordCount = brutalWords.filter(word => lowerFeedback.includes(word)).length;
    brutalityScore += brutalWordCount * 2;

    // Count sarcasm indicators
    const sarcasmCount = sarcasmIndicators.filter(phrase => lowerFeedback.includes(phrase)).length;
    brutalityScore += sarcasmCount * 3;

    // Count mocking phrases
    const mockingCount = mockingPhrases.filter(phrase => lowerFeedback.includes(phrase)).length;
    brutalityScore += mockingCount * 4;

    // Check for question marks (indicates mocking questions)
    const questionCount = (response.feedback.match(/\?/g) || []).length;
    brutalityScore += questionCount * 2;

    // Check for capitalized words (indicates emphasis/yelling)
    const capsWords = (response.feedback.match(/\b[A-Z]{2,}\b/g) || []).length;
    brutalityScore += capsWords * 1;

    // Penalties for being too nice
    const niceWords = ['nice', 'good', 'fine', 'okay', 'pleasant', 'lovely', 'decent', 'acceptable'];
    const niceWordCount = niceWords.filter(word => lowerFeedback.includes(word)).length;
    brutalityScore -= niceWordCount * 3;

    // Check for proper section structure
    const expectedSections = ['**Style:**', '**Color Coordination:**', '**Fit:**', '**Overall Impression:**'];
    const foundSections = expectedSections.filter(section => 
      response.feedback.includes(section)
    );
    
    if (foundSections.length < 3) {
      warnings.push('Missing expected roast section structure');
    }
  }

  // Validate suggestions for roast mode
  if (!response.suggestions || response.suggestions.length === 0) {
    errors.push('At least one brutal suggestion is required');
  } else {
    response.suggestions.forEach((suggestion, index) => {
      if (!suggestion || suggestion.trim().length < 15) {
        errors.push(`Roast suggestion ${index + 1} is too short`);
      }

      // Check if suggestions are brutal enough
      const lowerSuggestion = suggestion.toLowerCase();
      const hasBrutality = ['completely', 'entirely', 'totally', 'absolutely', 'immediately', 'desperately', 'urgently', 'burn', 'throw away', 'start over'].some(word => lowerSuggestion.includes(word));
      
      if (!hasBrutality) {
        warnings.push(`Suggestion ${index + 1} could be more brutal/emphatic`);
      }
    });
  }

  // Overall brutality assessment
  if (brutalityScore < 5) {
    warnings.push(`Brutality score too low (${brutalityScore}) - needs more savage language`);
  } else if (brutalityScore < 10) {
    warnings.push(`Brutality score moderate (${brutalityScore}) - could be more savage`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    brutalityScore
  };
}

export function assessRoastQuality(response: AnalyzeOutfitResponse): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let qualityScore = 100;

  const validation = validateRoastResponse(response);
  
  // Deduct points for validation issues
  qualityScore -= validation.errors.length * 20;
  qualityScore -= validation.warnings.length * 10;

  // Assess brutality level
  if (validation.brutalityScore < 10) {
    issues.push('Insufficient brutality level');
    recommendations.push('Increase savage language and mocking tone');
    qualityScore -= 30;
  }

  // Check for humor and creativity
  const humorIndicators = ['😂', 'lol', 'hilarious', 'comedy', 'joke', 'funny'];
  const hasHumor = humorIndicators.some(indicator => 
    response.feedback.toLowerCase().includes(indicator.toLowerCase())
  );

  if (!hasHumor) {
    recommendations.push('Add more humorous and creative insults');
    qualityScore -= 10;
  }

  // Check for specific and creative critiques
  if (response.feedback.length < 300) {
    issues.push('Roast feedback too brief for proper destruction');
    recommendations.push('Expand with more detailed savage commentary');
    qualityScore -= 15;
  }

  return {
    score: Math.max(0, qualityScore),
    issues,
    recommendations
  };
}
