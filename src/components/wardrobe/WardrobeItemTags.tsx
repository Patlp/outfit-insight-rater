
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Shirt, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClothingItemsProcessor, { ExtractedClothingItem } from './ClothingItemsProcessor.tsx';
import GenerationProgressIndicator from './GenerationProgressIndicator';

interface WardrobeItemTagsProps {
  feedback?: string;
  extractedClothingItems?: any;
  itemId: string;
}

const WardrobeItemTags: React.FC<WardrobeItemTagsProps> = ({
  feedback,
  extractedClothingItems,
  itemId
}) => {
  const [showClothingItems, setShowClothingItems] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleGenerationComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Parse clothing items safely
  const clothingItems = React.useMemo(() => {
    if (!extractedClothingItems) return [];
    
    try {
      if (Array.isArray(extractedClothingItems)) {
        return extractedClothingItems as ExtractedClothingItem[];
      }
      return [];
    } catch (error) {
      console.error('❌ Error parsing clothing items:', error);
      return [];
    }
  }, [extractedClothingItems, refreshKey]);

  const hasClothingItems = clothingItems.length > 0;
  const totalItems = clothingItems.length;

  return (
    <div className="space-y-4">
      {/* Generation Progress Indicator */}
      <GenerationProgressIndicator 
        wardrobeItemId={itemId}
        onComplete={handleGenerationComplete}
      />

      {/* Clothing Items Section - Tags Only without confidence */}
      {hasClothingItems && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shirt size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Detected Items ({totalItems})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClothingItems(!showClothingItems)}
              className="h-6 px-2 text-xs"
            >
              {showClothingItems ? (
                <>
                  <EyeOff size={12} className="mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye size={12} className="mr-1" />
                  Show
                </>
              )}
            </Button>
          </div>

          {showClothingItems && (
            <div className="space-y-2">
              {clothingItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="font-medium text-sm capitalize text-gray-900">
                    {item.name}
                  </span>
                  {item.category && (
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  )}
                  {/* Removed confidence percentage display */}
                  {item.descriptors && item.descriptors.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.descriptors.slice(0, 3).map((descriptor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {descriptor}
                        </Badge>
                      ))}
                      {item.descriptors.length > 3 && (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          +{item.descriptors.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WardrobeItemTags;
