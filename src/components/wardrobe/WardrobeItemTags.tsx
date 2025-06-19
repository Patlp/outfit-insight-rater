
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Shirt, Sparkles, Eye, EyeOff, Info, CheckCircle,  AlertTriangle} from 'lucide-react';
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
    // Trigger a refresh of the clothing items display
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
  const aiGeneratedCount = clothingItems.filter(item => item?.renderImageUrl).length;
  const totalItems = clothingItems.length;

  return (
    <div className="space-y-4">
      {/* Enhanced API Status Notice */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <CheckCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <span className="font-medium">AI Image Generation Active:</span> TheNewBlack API integration has been enhanced with improved authentication and fallback mechanisms. Professional image generation is available for newly uploaded outfits.
        </div>
      </div>

      {/* API Validation Notice */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <span className="font-medium">Service Status:</span> If TheNewBlack API is unavailable, the system will automatically fallback to OpenAI DALL-E for image generation.
        </div>
      </div>

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
    </div>
  );
};

export default WardrobeItemTags;
