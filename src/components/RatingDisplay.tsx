
import React from 'react';
import { useRating } from '@/context/RatingContext';
import { Star } from 'lucide-react';
import ShareRating from './ShareRating';

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
  const formatSuggestion = (suggestion: string) => {
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
  const validSuggestions = suggestions ? suggestions
    .filter(suggestion => 
      suggestion && 
      suggestion.trim().length > 5 && 
      !suggestion.match(/^\s*\*\*\s*$/)) : [];
  
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
      
      {validSuggestions && validSuggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-fashion-600 border-b border-fashion-200 pb-2">Style Suggestions</h3>
          <ul className="space-y-3 mt-4">
            {validSuggestions.map((suggestion, index) => {
              const formattedSuggestion = formatSuggestion(suggestion);
              return formattedSuggestion ? (
                <li key={index} className="flex items-start gap-2">
                  <div className="min-w-5 mt-1">
                    <div className="w-3 h-3 rounded-full bg-fashion-500"></div>
                  </div>
                  <p className="text-gray-700">
                    {formattedSuggestion}
                  </p>
                </li>
              ) : null;
            })}
          </ul>
        </div>
      )}
      
      <ShareRating />
      
      <div className="mt-6 pt-6 border-t border-fashion-200">
        <p className="text-sm text-gray-500 italic">
          Remember, fashion is subjective and these suggestions are just guidelines!
        </p>
      </div>
    </div>
  );
};

export default RatingDisplay;
