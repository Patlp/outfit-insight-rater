
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ImageIcon } from 'lucide-react';

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
  [key: string]: any; // Add index signature for Json compatibility
}

interface ClothingItemsProcessorProps {
  extractedClothingItems: ExtractedClothingItem[];
  wardrobeItemId: string;
  originalImageUrl?: string;
}

const ClothingItemsProcessor: React.FC<ClothingItemsProcessorProps> = ({
  extractedClothingItems
}) => {
  if (!extractedClothingItems || extractedClothingItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No clothing items detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {extractedClothingItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <span className="font-medium text-sm capitalize text-gray-900">
            {item.name}
          </span>
          {item.category && (
            <Badge variant="secondary" className="text-xs">
              {item.category}
            </Badge>
          )}
          {item.confidence && (
            <Badge variant="outline" className="text-xs">
              {Math.round(item.confidence * 100)}%
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
      ))}
    </div>
  );
};

export default ClothingItemsProcessor;
