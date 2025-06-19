
import React from 'react';
import { ExtractedClothingItem } from './ClothingItemsProcessor.tsx';
import { Toggle } from '@/components/ui/toggle';
import { Image, Camera, Shirt } from 'lucide-react';
import { getBestImageUrl, hasAIGeneratedImage } from './ClothingItemsProcessor';

interface ItemImageDisplayProps {
  item: ExtractedClothingItem;
  originalImageUrl?: string;
  showOriginalThumbnail: boolean;
  onToggleImageView: (showOriginal: boolean) => void;
}

const ItemImageDisplay: React.FC<ItemImageDisplayProps> = ({
  item,
  originalImageUrl,
  showOriginalThumbnail,
  onToggleImageView
}) => {
  const getDisplayImageUrl = () => {
    // If user wants to see original, show that
    if (showOriginalThumbnail && originalImageUrl) {
      console.log(`📷 Displaying original image for "${item.name}": ${originalImageUrl}`);
      return originalImageUrl;
    }
    
    // Otherwise, use the best available image (prioritizing persisted AI images)
    const bestUrl = getBestImageUrl(item as any);
    console.log(`🖼️ Displaying best image for "${item.name}": ${bestUrl}`);
    return bestUrl;
  };

  const displayImageUrl = getDisplayImageUrl();
  const hasPersistedAI = hasAIGeneratedImage(item as any);

  // Log the image status for debugging
  console.log(`🔍 Image status for "${item.name}":`, {
    hasPersistedAI,
    renderImageUrl: item.renderImageUrl,
    displayImageUrl,
    showOriginalThumbnail,
    originalImageUrl
  });

  // Ensure boolean values for Toggle components
  const isShowingAI = Boolean(!showOriginalThumbnail);
  const isShowingOriginal = Boolean(showOriginalThumbnail);

  return (
    <div className="relative h-48 bg-gray-100">
      {displayImageUrl ? (
        <div className="relative h-full">
          <img
            src={displayImageUrl}
            alt={item.name}
            className="w-full h-full object-contain bg-white"
            onLoad={() => {
              console.log('✅ Item image loaded:', displayImageUrl);
            }}
            onError={(e) => {
              console.error('❌ Failed to load item image:', displayImageUrl);
              // Fallback to placeholder
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          
          {/* Image Toggle Controls - only show if we have both AI and original */}
          {originalImageUrl && hasPersistedAI && (
            <div className="absolute top-2 left-2">
              <div className="flex bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-md">
                <Toggle
                  pressed={isShowingAI}
                  onPressedChange={(pressed: boolean) => onToggleImageView(!pressed)}
                  className="h-8 px-2 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
                  size="sm"
                  title="Show AI Generated Image"
                >
                  <Image size={14} />
                </Toggle>
                <Toggle
                  pressed={isShowingOriginal}
                  onPressedChange={(pressed: boolean) => onToggleImageView(pressed)}
                  className="h-8 px-2 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-700"
                  size="sm"
                  title="Show Original Photo"
                >
                  <Camera size={14} />
                </Toggle>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Shirt size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No image available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemImageDisplay;
