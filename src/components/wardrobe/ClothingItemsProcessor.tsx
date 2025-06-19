
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Image as ImageIcon, Clock, Target } from 'lucide-react';
import { toast } from 'sonner';
import { triggerContextAwareAIImageGeneration } from '@/services/wardrobe/aiImageIntegration';
import ItemImageDisplay from './ItemImageDisplay';

// Use a local interface for the extracted clothing items from wardrobe_items.extracted_clothing_items
export interface ExtractedClothingItem {
  name: string;
  descriptors?: string[];
  category?: string;
  confidence?: number;
  renderImageUrl?: string;
  renderImageProvider?: string;
  renderImageGeneratedAt?: string;
  renderImageSourceType?: string;
  croppedImageUrl?: string;
  boundingBox?: any;
  croppingConfidence?: number;
  imageType?: string;
  contextualProcessing?: boolean;
  accuracyLevel?: string;
  [key: string]: any;
}

interface ClothingItemsProcessorProps {
  extractedClothingItems: ExtractedClothingItem[];
  wardrobeItemId: string;
  originalImageUrl?: string;
}

const ClothingItemsProcessor: React.FC<ClothingItemsProcessorProps> = ({
  extractedClothingItems,
  wardrobeItemId,
  originalImageUrl
}) => {
  const [showOriginalThumbnail, setShowOriginalThumbnail] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRegenerateImages = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      console.log('🔄 Manually triggering context-aware AI image generation for newly uploaded content...');
      await triggerContextAwareAIImageGeneration(wardrobeItemId, 'context_aware_openai');
      toast.success('Context-aware AI image generation started! Maximum accuracy for newly uploaded content.');
    } catch (error) {
      console.error('❌ Error triggering context-aware AI generation:', error);
      toast.error('Failed to start context-aware AI image generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const hasAnyRenderImages = extractedClothingItems.some(item => item.renderImageUrl);
  const itemsWithoutImages = extractedClothingItems.filter(item => !item.renderImageUrl).length;
  const contextAwareCount = extractedClothingItems.filter(item => 
    item.renderImageProvider?.includes('context_aware')
  ).length;

  if (!extractedClothingItems || extractedClothingItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No clothing items detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Bar - Only show for newly uploaded content */}
      {itemsWithoutImages > 0 && (
        <div className="flex items-center justify-between bg-emerald-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <Target size={16} />
            <span>{itemsWithoutImages} items can be enhanced with Context-Aware AI</span>
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <Clock size={12} />
              <span>Maximum accuracy for newly uploaded content</span>
            </div>
          </div>
          <Button
            onClick={handleRegenerateImages}
            disabled={isGenerating}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Target size={14} className="mr-1" />
                Generate Accurate Images
              </>
            )}
          </Button>
        </div>
      )}

      {/* Clothing Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {extractedClothingItems.map((item, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
            {/* Item Image */}
            <ItemImageDisplay
              item={item}
              originalImageUrl={originalImageUrl}
              showOriginalThumbnail={showOriginalThumbnail}
              onToggleImageView={setShowOriginalThumbnail}
            />

            {/* Item Details */}
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-sm capitalize text-gray-900 leading-tight">
                  {item.name}
                </h4>
                {item.confidence && (
                  <Badge variant="outline" className="text-xs ml-2 shrink-0">
                    {Math.round(item.confidence * 100)}%
                  </Badge>
                )}
              </div>

              {/* Category and Descriptors */}
              <div className="space-y-2">
                {item.category && (
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                )}
                
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

              {/* AI Generation Status */}
              {item.renderImageUrl && (
                <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 rounded-full px-2 py-1">
                  {item.renderImageProvider?.includes('context_aware') ? (
                    <Target size={10} />
                  ) : (
                    <Sparkles size={10} />
                  )}
                  <span>
                    {item.renderImageProvider?.includes('context_aware') 
                      ? 'Context-Aware AI' 
                      : `Enhanced by ${item.renderImageProvider || 'AI'}`
                    }
                  </span>
                </div>
              )}

              {/* Accuracy Level Indicator */}
              {item.accuracyLevel === 'maximum' && (
                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 rounded-full px-2 py-1">
                  <Target size={10} />
                  <span>Maximum Accuracy</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Summary */}
      {hasAnyRenderImages && (
        <div className="text-center text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
          {contextAwareCount > 0 ? (
            <>Professional images powered by Context-Aware AI with Taxonomy Integration ({contextAwareCount} high-accuracy)</>
          ) : (
            <>Professional images powered by Enhanced OpenAI DALL-E 3 (applied to newly uploaded content only)</>
          )}
        </div>
      )}
    </div>
  );
};

export default ClothingItemsProcessor;
