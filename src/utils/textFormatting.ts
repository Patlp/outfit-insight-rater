
// Parse markdown bold syntax (**text**) to HTML
export const parseMarkdownBold = (text: string): string => {
  if (!text) return '';
  
  // Replace **text** with <strong>text</strong>
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Also handle single asterisk bold formatting like *text*
  formatted = formatted.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  
  return formatted;
};

// Clean and standardize raw OpenAI fashion feedback output
export const cleanFashionFeedbackOutput = (rawText: string): string => {
  if (!rawText) return '';
  
  let cleanedText = rawText;
  
  // Remove redundant labels that shouldn't be displayed
  cleanedText = cleanedText.replace(/^(Score:|Feedback:|Rating:|Improvement:|Detailed Feedback:)\s*/gmi, '');
  cleanedText = cleanedText.replace(/(Score:|Rating:|Improvement:|\/10|\d+\s*out of\s*10|on a scale of \d+)/gi, '');
  
  // Remove markdown artifacts and malformed tokens
  cleanedText = cleanedText.replace(/\*\*\s*\*\*/g, ''); // Remove empty bold markers
  cleanedText = cleanedText.replace(/^\*\*\s*$/gm, ''); // Remove lines with just asterisks
  
  // Remove standalone section titles that shouldn't be part of content
  cleanedText = cleanedText.replace(/^(Style|Improvement|Feedback|Score)$/gmi, '');
  
  // Clean up list formatting and prevent section titles in bullet points
  cleanedText = cleanedText.replace(/^[\-\*]\s*(Improvement Suggestions?|Style Suggestions?):?/gmi, '');
  cleanedText = cleanedText.replace(/^[\-\*]\s*(Detailed Feedback):?/gmi, '');
  
  // Remove numbered list indicators from the beginning of lines
  cleanedText = cleanedText.replace(/^\d+\.\s*/gm, '');
  cleanedText = cleanedText.replace(/^\(\d+\)\s*\**/gm, '');
  
  // Clean up extra whitespace and empty lines
  cleanedText = cleanedText.replace(/\n\s*\n\s*\n/g, '\n\n'); // Reduce multiple line breaks
  cleanedText = cleanedText.replace(/^\s+|\s+$/g, ''); // Trim start/end whitespace
  
  return cleanedText;
};

// Format feedback into clean sections with clear headings
export const formatFeedbackSections = (text: string): string[] => {
  if (!text) return [];
  
  // First clean the raw text
  const cleanedText = cleanFashionFeedbackOutput(text);
  
  // Define common fashion feedback section identifiers
  const sectionIdentifiers = [
    'Style:', 'Color Coordination:', 'Fit:', 'Overall Impression:',
    'Style', 'Color Coordination', 'Fit', 'Overall Impression',
    'Pattern:', 'Accessories:', 'Proportions:',
    'Layering:', 'Color:', 'Patterns:', 'Silhouette:'
  ];
  
  let formattedText = cleanedText;
  
  // Replace section identifiers with HTML heading elements
  sectionIdentifiers.forEach(identifier => {
    const regex = new RegExp(`(^|\\n)(- ${identifier}|${identifier})\\s*`, 'gm');
    formattedText = formattedText.replace(regex, `$1<h4 class="text-fashion-600 font-semibold mt-4 mb-2">${identifier}</h4>`);
  });
  
  // Split into paragraphs and create formatted HTML
  const paragraphs = formattedText
    .split(/\n+/)
    .filter(p => p.trim().length > 0)
    .map(p => {
      const trimmedP = p.trim();
      // If the paragraph doesn't start with an h4 tag, wrap it in a p tag and apply bold formatting
      if (!trimmedP.startsWith('<h4')) {
        return `<p class="mb-3 text-gray-700">${parseMarkdownBold(trimmedP)}</p>`;
      }
      return trimmedP;
    })
    .filter(p => p.length > 0); // Remove any empty paragraphs
  
  return paragraphs;
};

// Clean and format individual suggestions
export const cleanSuggestionText = (suggestion: string): string => {
  if (!suggestion) return '';
  
  let cleaned = suggestion;
  
  // Remove section titles that shouldn't be in suggestions
  cleaned = cleaned.replace(/^(Improvement Suggestions?|Style Suggestions?):?\s*/gi, '');
  
  // Remove list markers
  cleaned = cleaned.replace(/^(\d+\.\s*|\-\s*|\*\s*)/, '');
  
  // Remove starting asterisks and clean markdown artifacts
  cleaned = cleaned.replace(/^\s*\*\*+\s*/g, '');
  cleaned = cleaned.replace(/\*\*\s*\*\*/g, '');
  
  return cleaned.trim();
};

// Format style suggestions with clean heading styling - returns formatted string
export const formatSuggestion = (suggestion: string): string => {
  if (!suggestion || suggestion.trim().length < 5) return '';
  
  // Clean the suggestion first
  const cleanSuggestion = cleanSuggestionText(suggestion);
  if (!cleanSuggestion || cleanSuggestion.length < 5) return '';
  
  // Look for category patterns like "**Accessories:**" or "Footwear:"
  const headingPattern = /^(.*?):\s*(.*)/;
  const match = cleanSuggestion.match(headingPattern);
  
  if (match && match[1] && match[2]) {
    const heading = match[1].replace(/\*\*/g, '').trim();
    const content = match[2].trim();
    
    if (heading && content) {
      return `<span class="font-semibold text-fashion-600">${heading}:</span> <span>${parseMarkdownBold(content)}</span>`;
    }
  }
  
  // If no pattern match, just return the cleaned suggestion with bold formatting applied
  return parseMarkdownBold(cleanSuggestion);
};

// Filter out empty or problematic suggestions
export const filterValidSuggestions = (suggestions: string[]): string[] => {
  if (!suggestions) return [];
  
  return suggestions
    .map(suggestion => cleanSuggestionText(suggestion))
    .filter(suggestion => 
      suggestion && 
      suggestion.trim().length > 5 && 
      !suggestion.match(/^\s*\*\*\s*$/) &&
      !suggestion.match(/^(Improvement Suggestions?|Style Suggestions?):?\s*$/gi)
    );
};
