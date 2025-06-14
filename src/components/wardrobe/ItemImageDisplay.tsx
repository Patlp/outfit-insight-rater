
import React from 'react';
import { ClothingItem } from './ClothingItemsProcessor';
import { Toggle } from '@/components/ui/toggle';
import { Image, Camera, Shirt } from 'lucide-react';
import { getRenderImageUrl, itemNeedsRenderImage } from '@/services/wardrobe/aiImageIntegration';
import AIGenerationStatus from './AIGenerationStatus';

interface ItemImageDisplayProps {
  item: ClothingItem;
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
    if (showOriginalThumbnail && originalImageUrl) {
      return originalImageUrl;
    }
    return item.renderImageUrl || getRenderImageUrl(item, originalImageUrl);
  };

  const displayImageUrl = getDisplayImageUrl();
  const needsRenderImage = itemNeedsRenderImage(item);
  const isGenerating = needsRenderImage && !item.renderImageUrl;

  return (
    <div className="relative h-48 bg-gray-100">
      {displayImageUrl ? (
        <div className="relative h-full">
          <img
            src={displayImageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onLoad={() => {
              console.log('✅ Item image loaded:', displayImageUrl);
            }}
            onError={(e) => {
              console.error('❌ Failed to load item image:', displayImageUrl);
              // Fallback to placeholder
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          
          {/* Image Toggle Controls */}
          {originalImageUrl && (
            <div className="absolute top-2 left-2">
              <div className="flex bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-md">
                <Toggle
                  pressed={!showOriginalThumbnail}
                  onPressedChange={(pressed) => onToggleImageView(!pressed)}
                  className="h-8 px-2 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
                  size="sm"
                >
                  <Image size={14} />
                </Toggle>
                <Toggle
                  pressed={showOriginalThumbnail}
                  onPressedChange={(pressed) => onToggleImageView(pressed)}
                  className="h-8 px-2 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-700"
                  size="sm"
                >
                  <Camera size={14} />
                </Toggle>
              </div>
            </div>
          )}
          
          {/* AI Generation Status */}
          <div className="absolute top-2 right-2">
            <AIGenerationStatus
              isGenerating={isGenerating}
              hasRenderImage={!!item.renderImageUrl}
              itemName={item.name}
            />
          </div>

          {/* Original Image Badge */}
          {showOriginalThumbnail && originalImageUrl && (
            <div className="absolute bottom-2 right-2">
              <div className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <span className="text-xs">📷</span>
                Original
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Shirt size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No image available</p>
            <div className="mt-2">
              <AIGenerationStatus
                isGenerating={isGenerating}
                hasRenderImage={!!item.renderImageUrl}
                itemName={item.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemImageDisplay;
