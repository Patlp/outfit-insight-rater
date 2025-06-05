
import React from 'react';
import { Star } from 'lucide-react';

interface WardrobeItemImageProps {
  imageUrl: string;
  score: number;
}

const WardrobeItemImage: React.FC<WardrobeItemImageProps> = ({ imageUrl, score }) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="relative">
      <img
        src={imageUrl}
        alt="Outfit"
        className="w-full h-48 object-cover"
      />
      <div className="absolute top-2 right-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
          <Star size={14} className={`${getScoreColor(score)}`} />
          <span className={`text-sm font-medium ${getScoreColor(score)}`}>
            {score}/10
          </span>
        </div>
      </div>
    </div>
  );
};

export default WardrobeItemImage;
