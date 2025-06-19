
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Shirt, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClothingItemsProcessor from './ClothingItemsProcessor.tsx';
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
    // Trigger a refresh of the clothing items display
    setRefreshKey(prev => prev + 1);
  };

  // Parse clothing items safely
  const clothingItems = React.useMemo(() => {
    if (!extractedClothingItems) return [];
    
    try {
      if (Array.isArray(extractedClothingItems)) {
        return extractedClothingItems;
      }
      return [];
    } catch (error) {
      console.error('❌ Error parsing clothing items:', error);
      return [];
    }
  }, [extractedClothingItems, refreshKey]);

  const hasClothingItems = clothingItems.length > 0;
  const aiGeneratedCount = clothingItems.filter(item => item?.renderImageUrl).length;
  const totalItems = clothingItems.length;

  return (
    <div className="space-y-4">
      {/* Generation Progress Indicator */}
      <GenerationProgressIndicator 
        wardrobeItemId={itemId}
        onComplete={handleGenerationComplete}
      />

      {/* Clothing Items Section */}
      {hasClothingItems && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shirt size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Detected Items ({totalItems})
              </span>
              {aiGeneratedCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  <Sparkles size={10} className="mr-1" />
                  {aiGeneratedCount} AI Enhanced
                </Badge>
              )}
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
            <ClothingItemsProcessor
              key={refreshKey}
              extractedClothingItems={clothingItems}
              wardrobeItemId={itemId}
            />
          )}
        </div>
      )}

      {/* Feedback Tags (if no clothing items detected) */}
      {!hasClothingItems && feedback && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Style Notes</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {feedback.split(' ').slice(0, 8).map((word, index) => {
              const cleanWord = word.replace(/[^\w\s]/gi, '').toLowerCase();
              if (cleanWord.length < 3) return null;
              
              return (
                <Badge key={index} variant="outline" className="text-xs">
                  {cleanWord}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WardrobeItemTags;
