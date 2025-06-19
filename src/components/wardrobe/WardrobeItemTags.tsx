
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Shirt, Sparkles, Eye, EyeOff, CheckCircle, Zap, Star } from 'lucide-react';
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
  const aiGeneratedCount = clothingItems.filter(item => item?.renderImageUrl).length;
  const enhancedCount = clothingItems.filter(item => 
    item?.renderImageProvider === 'openai_enhanced'
  ).length;
  const totalItems = clothingItems.length;

  return (
    <div className="space-y-4">
      {/* Enhanced AI Status Notice */}
      <div className="flex items-start gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
        <Star size={16} className="text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <span className="font-medium">Enhanced OpenAI Generation System:</span> Now featuring professional studio-quality image generation with clothing-specific prompts and DALL-E 3 for ultra-realistic product photography.
        </div>
      </div>

      {/* Professional Quality Notice */}
      <div className="flex items-start gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
        <Zap size={16} className="text-green-600 mt-0.5 shrink-0" />
        <div className="text-sm text-green-800">
          <span className="font-medium">Professional Standards:</span> All generated images meet ASOS, Zara, and Uniqlo quality standards with studio lighting, white backgrounds, and ghost mannequin styling for your digital wardrobe.
        </div>
      </div>

      {/* Generation Progress Indicator */}
      <GenerationProgressIndicator 
        wardrobeItemId={itemId}
        onComplete={handleGenerationComplete}
      />

      {/* Enhanced Clothing Items Section */}
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
                  {aiGeneratedCount} AI Generated
                </Badge>
              )}
              {enhancedCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                  <Star size={10} className="mr-1" />
                  {enhancedCount} Enhanced
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
