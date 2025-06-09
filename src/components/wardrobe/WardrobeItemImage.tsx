
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
        className="w-full h-80 object-cover rounded-t-lg"
      />
      <div className="absolute top-4 right-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 flex items-center gap-2 shadow-md">
          <Star size={16} className={`${getScoreColor(score)} fill-current`} />
          <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
            {score}/10
          </span>
        </div>
      </div>
    </div>
  );
};

export default WardrobeItemImage;
