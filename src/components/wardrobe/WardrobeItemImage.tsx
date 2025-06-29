
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

  console.log('🖼️ WardrobeItemImage - Rendering with:', { imageUrl, score });

  return (
    <div className="relative">
      <AspectRatio ratio={4/5} className="bg-gray-100 rounded-t-lg overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Outfit"
            className="w-full h-full object-cover bg-white"
            onLoad={() => {
              console.log('✅ Wardrobe outfit image loaded successfully:', imageUrl);
            }}
            onError={(e) => {
              console.error('❌ Failed to load wardrobe outfit image:', imageUrl);
              console.error('Image error details:', {
                src: (e.target as HTMLImageElement).src,
                naturalWidth: (e.target as HTMLImageElement).naturalWidth,
                naturalHeight: (e.target as HTMLImageElement).naturalHeight,
                complete: (e.target as HTMLImageElement).complete
              });
              // Set fallback placeholder
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-500">No image available</span>
          </div>
        )}
        
        {/* Fallback placeholder if image fails to load */}
        {imageUrl && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500"
            style={{ display: 'none' }}
            id={`fallback-${imageUrl.split('/').pop()}`}
          >
            Image unavailable
          </div>
        )}
      </AspectRatio>
      
      {score > 0 && (
        <div className="absolute top-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 flex items-center gap-2 shadow-md">
            <Star size={16} className={`${getScoreColor(score)} fill-current`} />
            <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
              {score}/10
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardrobeItemImage;
