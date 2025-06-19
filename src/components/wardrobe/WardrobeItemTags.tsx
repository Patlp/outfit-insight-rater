
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Shirt, Sparkles, Eye, EyeOff, CheckCircle, Zap, Star, Target } from 'lucide-react';
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
  const contextAwareCount = clothingItems.filter(item => 
    item?.renderImageProvider?.includes('context_aware')
  ).length;
  const totalItems = clothingItems.length;

  return (
    <div className="space-y-4">
      {/* Context-Aware AI Status Notice */}
      <div className="flex items-start gap-2 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-3">
        <Target size={16} className="text-emerald-600 mt-0.5 shrink-0" />
        <div className="text-sm text-emerald-800">
          <span className="font-medium">Context-Aware AI Generation System:</span> Now featuring maximum accuracy image generation with taxonomy integration, enhanced item detection, and contextual prompts for ultra-precise clothing representation.
        </div>
      </div>

      {/* Accuracy Enhancement Notice */}
      <div className="flex items-start gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
        <Zap size={16} className="text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <span className="font-medium">Enhanced Accuracy:</span> Our new system uses fashion taxonomy data, contextual understanding, and smart prompt engineering to generate images that accurately match your tagged clothing items.
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
              {contextAwareCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                  <Target size={10} className="mr-1" />
                  {contextAwareCount} Context-Aware
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
