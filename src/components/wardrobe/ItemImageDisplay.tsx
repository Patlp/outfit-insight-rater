import React from 'react';
import { ExtractedClothingItem } from './ClothingItemsProcessor.tsx';
import { Toggle } from '@/components/ui/toggle';
import { Image, Camera, Shirt } from 'lucide-react';
import { getBestImageUrl, hasAIGeneratedImage, isAIImagePersisted } from './ClothingItemsProcessor';
import AIGenerationStatus from './AIGenerationStatus';

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
  const isPersisted = isAIImagePersisted(item as any);
  const needsGeneration = !hasPersistedAI && item.name;

  // Log the image status for debugging
  console.log(`🔍 Image status for "${item.name}":`, {
    hasPersistedAI,
    isPersisted,
    needsGeneration,
    renderImageUrl: item.renderImageUrl,
    displayImageUrl,
    showOriginalThumbnail
  });

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
                  pressed={!showOriginalThumbnail}
                  onPressedChange={(pressed) => onToggleImageView(!pressed)}
                  className="h-8 px-2 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
                  size="sm"
                  title="Show AI Generated Image"
                >
                  <Image size={14} />
                </Toggle>
                <Toggle
                  pressed={showOriginalThumbnail}
                  onPressedChange={(pressed) => onToggleImageView(pressed)}
                  className="h-8 px-2 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-700"
                  size="sm"
                  title="Show Original Photo"
                >
                  <Camera size={14} />
                </Toggle>
              </div>
            </div>
          )}
          
          {/* AI Generation Status */}
          <div className="absolute top-2 right-2">
            <AIGenerationStatus
              isGenerating={needsGeneration}
              hasRenderImage={hasPersistedAI}
              itemName={item.name}
            />
          </div>

          {/* Image Type Badge */}
          <div className="absolute bottom-2 right-2">
            {showOriginalThumbnail && originalImageUrl ? (
              <div className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <span className="text-xs">📷</span>
                Original
              </div>
            ) : hasPersistedAI ? (
              <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <span className="text-xs">🎨</span>
                AI Generated
              </div>
            ) : null}
          </div>

          {/* Persisted Status Indicator */}
          {hasPersistedAI && isPersisted && !showOriginalThumbnail && (
            <div className="absolute bottom-2 left-2">
              <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <span className="text-xs">💾</span>
                Saved
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
                isGenerating={needsGeneration}
                hasRenderImage={hasPersistedAI}
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
