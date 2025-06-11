
import React from 'react';
import { Star } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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

  console.log('🖼️ Rendering outfit image:', imageUrl);

  return (
    <div className="relative">
      <AspectRatio ratio={4/5} className="bg-gray-100 rounded-t-lg overflow-hidden">
        <img
          src={imageUrl}
          alt="Outfit"
          className="w-full h-full object-contain bg-white"
          onLoad={() => {
            console.log('✅ Outfit image loaded successfully:', imageUrl);
          }}
          onError={(e) => {
            console.error('❌ Failed to load outfit image:', imageUrl);
            console.error('Image error event:', e);
          }}
        />
      </AspectRatio>
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
