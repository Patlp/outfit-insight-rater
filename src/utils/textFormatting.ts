// Enhanced text formatting utilities that work with improved AI responses

// Parse markdown bold syntax (**text**) to HTML
export const parseMarkdownBold = (text: string): string => {
  if (!text) return '';
  
  // Handle the structured format from enhanced prompts: **Section:** content
  let formatted = text.replace(/\*\*([^*]+):\*\*\s*/g, '<strong>$1:</strong> ');
  
  // Handle regular bold formatting
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Handle single asterisk formatting
  formatted = formatted.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  
  return formatted;
};

// Enhanced cleaning for improved AI responses
export const cleanFashionFeedbackOutput = (rawText: string): string => {
  if (!rawText) return '';
  
  let cleanedText = rawText;
  
  // Remove score references that might have leaked through
  cleanedText = cleanedText.replace(/Score:\s*\d+\/10/gi, '');
  cleanedText = cleanedText.replace(/\d+\/10/g, '');
  
  // Clean up any malformed markdown that might have gotten through
  cleanedText = cleanedText.replace(/\*\*:\*\*/g, ':');
  cleanedText = cleanedText.replace(/\*\*\s*\*\*/g, '');
  
  // Remove suggestion section headers
  cleanedText = cleanedText.replace(/^(Suggestions?|Improvements?|Recommendations?):?\s*$/gmi, '');
  
  // Clean up extra whitespace
  cleanedText = cleanedText.replace(/\n\s*\n\s*\n/g, '\n\n');
  cleanedText = cleanedText.replace(/^\s+|\s+$/g, '');
  
  return cleanedText;
};

// Enhanced suggestion formatting for improved responses
export const formatSuggestion = (suggestion: string): string => {
  if (!suggestion || suggestion.trim().length < 5) return '';
  
  let cleaned = suggestion.trim();
  
  // Remove list markers if present
  cleaned = cleaned.replace(/^(\d+\.\s*|\-\s*|\*\s*)/, '');
  
  // Remove any section headers that shouldn't be in suggestions
  cleaned = cleaned.replace(/^(Improvement|Suggestions?|Style):?\s*/gi, '');
  
  // Remove malformed markdown
  cleaned = cleaned.replace(/^\*\*+\s*/g, '');
  cleaned = cleaned.replace(/\*\*:\*\*/g, ':');
  
  // Ensure proper capitalization
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  // Look for category patterns like "Accessories: suggestion text"
  const headingPattern = /^([^:]+):\s*(.+)/;
  const match = cleaned.match(headingPattern);
  
  if (match && match[1] && match[2]) {
    const heading = match[1].replace(/\*\*/g, '').trim();
    const content = match[2].trim();
    
    if (heading && content) {
      return `<span class="font-semibold text-fashion-600">${heading}:</span> <span>${parseMarkdownBold(content)}</span>`;
    }
  }
  
  // Return with bold formatting applied
  return parseMarkdownBold(cleaned);
};

// Enhanced suggestion filtering
export const filterValidSuggestions = (suggestions: string[]): string[] => {
  if (!suggestions) return [];
  
  return suggestions
    .map(suggestion => {
      let cleaned = suggestion.trim();
      // Remove list markers
      cleaned = cleaned.replace(/^(\d+\.\s*|\-\s*|\*\s*)/, '');
      // Remove section headers
      cleaned = cleaned.replace(/^(Improvement|Suggestions?|Style):?\s*/gi, '');
      return cleaned;
    })
    .filter(suggestion => 
      suggestion && 
      suggestion.length > 10 && 
      !suggestion.match(/^\s*\*\*\s*$/) &&
      !suggestion.match(/^(Improvement Suggestions?|Style Suggestions?):?\s*$/gi) &&
      // Filter out incomplete sentences
      suggestion.includes(' ') &&
      // Filter out malformed entries
      !suggestion.match(/^\*\*[:\s]*$/)
    )
    .slice(0, 3); // Limit to 3 suggestions max
};

// Compatibility functions (keeping for backwards compatibility)
export const formatFeedbackSections = (text: string): string[] => {
  if (!text) return [];
  
  const cleanedText = cleanFashionFeedbackOutput(text);
  const paragraphs = cleanedText
    .split(/\n+/)
    .filter(p => p.trim().length > 0)
    .map(p => {
      const trimmedP = p.trim();
      if (!trimmedP.startsWith('<h4') && !trimmedP.startsWith('**')) {
        return `<p class="mb-3 text-gray-700">${parseMarkdownBold(trimmedP)}</p>`;
      }
      return parseMarkdownBold(trimmedP);
    });
  
  return paragraphs;
};

export const cleanSuggestionText = (suggestion: string): string => {
  if (!suggestion) return '';
  
  let cleaned = suggestion.trim();
  cleaned = cleaned.replace(/^(Improvement|Suggestions?|Style):?\s*/gi, '');
  cleaned = cleaned.replace(/^(\d+\.\s*|\-\s*|\*\s*)/, '');
  cleaned = cleaned.replace(/^\s*\*\*+\s*/g, '');
  
  return cleaned;
};
