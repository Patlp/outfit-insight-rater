
import React from 'react';
import { Star } from 'lucide-react';

interface ScoreDisplayProps {
  score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
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
  );
};

export default ScoreDisplay;
