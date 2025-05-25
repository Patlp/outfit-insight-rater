
import React from 'react';
import { formatSuggestion, filterValidSuggestions } from '@/utils/textFormatting';

interface SuggestionsSectionProps {
  suggestions: string[];
}

const SuggestionsSection: React.FC<SuggestionsSectionProps> = ({ suggestions }) => {
  const validSuggestions = filterValidSuggestions(suggestions);

  if (!validSuggestions || validSuggestions.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-fashion-600 border-b border-fashion-200 pb-2">
        Style Suggestions
      </h3>
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
  );
};

export default SuggestionsSection;
