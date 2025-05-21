
import React from 'react';
import { useRating } from '@/context/RatingContext';
import { Star } from 'lucide-react';

const RatingDisplay: React.FC = () => {
  const { ratingResult } = useRating();
  
  if (!ratingResult) return null;
  
  const { score, feedback, suggestions } = ratingResult;
  
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Parse markdown bold syntax (**text**) to HTML
  const parseMarkdownBold = (text: string) => {
    if (!text) return '';
    
    // Replace **text** with <strong>text</strong>
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };
  
  // Format feedback into clean sections with clear headings
  const formatFeedbackSections = (text: string) => {
    if (!text) return [];
    
    // Define common fashion feedback section identifiers
    const sectionIdentifiers = [
      'Style:', 'Color Coordination:', 'Fit:', 'Overall Impression:',
      'Style', 'Color Coordination', 'Fit', 'Overall Impression',
      'Detailed Feedback:', 'Pattern:', 'Accessories:', 'Proportions:'
    ];
    
    let formattedText = text;
    
    // Remove numbered list indicators (1., 2., etc.)
    formattedText = formattedText.replace(/^\d+\.\s*/gm, '');
    
    // Remove extra sections like "Improvement:" or redundant headings
    formattedText = formattedText.replace(/(Improvement:|\/10|Score:)/gi, '');
    
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
  const formatSuggestion = (suggestion: string) => {
    // Clean up the suggestion text
    let cleanSuggestion = suggestion
      .replace(/^(\d+\.\s*|\-\s*|\*\s*)/, '') // Remove list markers (numbers, dashes, asterisks)
      .trim();
    
    // Look for category patterns like "Accessories:" or "Footwear:"
    const headingPattern = /^(\*\* - |\*\*|- |\- )?([A-Za-z\s&]+):/;
    const match = cleanSuggestion.match(headingPattern);
    
    if (match && match[2]) {
      const heading = match[2].trim();
      const content = cleanSuggestion.replace(headingPattern, '').trim();
      
      return (
        <>
          <span className="font-semibold text-fashion-600">{heading}:</span>{' '}
          <span dangerouslySetInnerHTML={{ __html: parseMarkdownBold(content) }} />
        </>
      );
    }
    
    return <span dangerouslySetInnerHTML={{ __html: parseMarkdownBold(cleanSuggestion) }} />;
  };
  
  const feedbackSections = formatFeedbackSections(feedback);
  
  return (
    <div className="animate-fade-in max-w-md w-full mx-auto mt-8 fashion-card">
      <div className="flex flex-col items-center mb-6">
        <h3 className="text-xl font-semibold mb-2 text-fashion-600">Your Style Score</h3>
        
        <div className="flex items-center justify-center gap-1">
          <span className={`text-4xl font-bold ${getScoreColor()}`}>{score}</span>
          <span className="text-xl font-medium text-gray-400">/10</span>
        </div>
        
        <div className="flex mt-2">
          {[...Array(10)].map((_, i) => (
            <Star
              key={i}
              size={20}
              className={`${
                i < score
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-fashion-600 border-b border-fashion-200 pb-2">Detailed Feedback</h3>
        <div className="space-y-1">
          {feedbackSections.map((section, index) => (
            <div 
              key={index}
              className="feedback-section"
              dangerouslySetInnerHTML={{ __html: parseMarkdownBold(section) }}
            />
          ))}
        </div>
      </div>
      
      {suggestions && suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-fashion-600 border-b border-fashion-200 pb-2">Style Suggestions</h3>
          <ul className="space-y-3 mt-4">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="min-w-5 mt-1">
                  <div className="w-3 h-3 rounded-full bg-fashion-500"></div>
                </div>
                <p className="text-gray-700">
                  {formatSuggestion(suggestion)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t border-fashion-200">
        <p className="text-sm text-gray-500 italic">
          Remember, fashion is subjective and these suggestions are just guidelines!
        </p>
      </div>
    </div>
  );
};

export default RatingDisplay;
