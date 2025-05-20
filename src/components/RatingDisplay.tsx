
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
  
  return (
    <div className="animate-fade-in max-w-md w-full mx-auto mt-8 fashion-card">
      <div className="flex flex-col items-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Your Style Score</h3>
        
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
        <h4 className="text-lg font-medium mb-2 text-fashion-700">Analysis</h4>
        <p className="text-gray-700">{feedback}</p>
      </div>
      
      {suggestions && suggestions.length > 0 && (
        <div>
          <h4 className="text-lg font-medium mb-2 text-fashion-700">Style Suggestions</h4>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="min-w-5 mt-1">
                  <div className="w-3 h-3 rounded-full fashion-gradient"></div>
                </div>
                <p className="text-gray-700">{suggestion}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-sm text-gray-500 italic">
          Remember, fashion is subjective and these suggestions are just guidelines!
        </p>
      </div>
    </div>
  );
};

export default RatingDisplay;
