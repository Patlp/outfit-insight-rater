
// Parse markdown bold syntax (**text**) to HTML
export const parseMarkdownBold = (text: string): string => {
  if (!text) return '';
  
  // Replace **text** with <strong>text</strong>
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

// Format feedback into clean sections with clear headings
export const formatFeedbackSections = (text: string): string[] => {
  if (!text) return [];
  
  // Define common fashion feedback section identifiers
  const sectionIdentifiers = [
    'Style:', 'Color Coordination:', 'Fit:', 'Overall Impression:',
    'Style', 'Color Coordination', 'Fit', 'Overall Impression',
    'Detailed Feedback:', 'Pattern:', 'Accessories:', 'Proportions:',
    'Layering:', 'Color:', 'Patterns:', 'Silhouette:'
  ];
  
  let formattedText = text;
  
  // Remove all numbered list indicators and formatting artifacts
  formattedText = formattedText.replace(/^\d+\.\s*/gm, '');
  formattedText = formattedText.replace(/^\(\d+\)\s*\*\*/gm, '');
  
  // Remove metadata and scoring info
  formattedText = formattedText.replace(/(Score:|Rating:|Improvement:|\/10|\d+\s*out of\s*10|on a scale of \d+)/gi, '');
  
  // Remove standalone headings when they're not part of a section
  formattedText = formattedText.replace(/^(Style|Improvement|Feedback|Score)$/gmi, '');
  
  // Replace section identifiers with HTML heading elements
  sectionIdentifiers.forEach(identifier => {
    const regex = new RegExp(`(- ${identifier}|${identifier})\\s`, 'g');
    formattedText = formattedText.replace(regex, `<h4 class="text-fashion-600 font-semibold mt-4 mb-2">${identifier}</h4>`);
  });
  
  // Split into paragraphs and create formatted HTML
  const paragraphs = formattedText
    .split(/\n+/)
    .filter(p => p.trim().length > 0)
    .map(p => {
      // If the paragraph doesn't start with an h4 tag, wrap it in a p tag
      if (!p.startsWith('<h4')) {
        return `<p class="mb-3 text-gray-700">${p}</p>`;
      }
      return p;
    });
  
  return paragraphs;
};

// Format style suggestions with clean heading styling
export const formatSuggestion = (suggestion: string): JSX.Element | null => {
  if (!suggestion || suggestion.trim().length < 5) return null;
  
  // Clean up the suggestion text
  let cleanSuggestion = suggestion
    .replace(/^(\d+\.\s*|\-\s*|\*\s*)/, '') // Remove list markers
    .replace(/^\s*\*\*/g, '') // Remove starting asterisks
    .trim();
  
  // Look for category patterns like "**Accessories:**" or "Footwear:"
  const headingPattern = /^(.*?):\s*(.*)/;
  const match = cleanSuggestion.match(headingPattern);
  
  if (match && match[1] && match[2]) {
    const heading = match[1].replace(/\*\*/g, '').trim();
    const content = match[2].trim();
    
    if (heading && content) {
      return (
        <>
          <span className="font-semibold text-fashion-600">{heading}:</span>{' '}
          <span dangerouslySetInnerHTML={{ __html: parseMarkdownBold(content) }} />
        </>
      );
    }
  }
  
  // If no pattern match, just return the cleaned suggestion
  return <span dangerouslySetInnerHTML={{ __html: parseMarkdownBold(cleanSuggestion) }} />;
};

// Filter out empty or problematic suggestions
export const filterValidSuggestions = (suggestions: string[]): string[] => {
  return suggestions ? suggestions
    .filter(suggestion => 
      suggestion && 
      suggestion.trim().length > 5 && 
      !suggestion.match(/^\s*\*\*\s*$/)) : [];
};
