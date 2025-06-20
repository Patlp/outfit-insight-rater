
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Palette } from 'lucide-react';

// Enhanced interface for the extracted clothing items with color information
export interface ExtractedClothingItem {
  name: string;
  primaryColor?: string;
  colorConfidence?: number;
  fullDescription?: string;
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
  colorExtracted?: boolean;
  extractionTimestamp?: string;
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

  // Helper function to get color badge variant based on color
  const getColorBadgeStyle = (color: string): React.CSSProperties => {
    const colorMap: Record<string, string> = {
      'black': '#000000',
      'white': '#FFFFFF',
      'navy blue': '#001f3f',
      'royal blue': '#4169E1',
      'sky blue': '#87CEEB',
      'burgundy': '#800020',
      'forest green': '#228B22',
      'olive green': '#6B8E23',
      'chocolate brown': '#7B3F00',
      'tan': '#D2B48C',
      'gray': '#808080',
      'charcoal': '#36454F',
      'cream': '#F5F5DC',
      'crimson': '#DC143C',
      'emerald green': '#50C878',
      'sage green': '#9CAF88',
      'camel': '#C19A6B',
      'pink': '#FFC0CB',
      'purple': '#800080',
      'yellow': '#FFFF00',
      'orange': '#FFA500'
    };

    const bgColor = colorMap[color.toLowerCase()] || '#E5E7EB';
    const textColor = ['black', 'navy blue', 'burgundy', 'forest green', 'chocolate brown', 'charcoal', 'purple'].includes(color.toLowerCase()) 
      ? 'white' 
      : color.toLowerCase() === 'white' 
        ? 'black' 
        : 'white';

    return {
      backgroundColor: bgColor,
      color: textColor,
      border: color.toLowerCase() === 'white' ? '1px solid #D1D5DB' : 'none'
    };
  };

  return (
    <div className="space-y-3">
      {extractedClothingItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm capitalize text-gray-900">
                {item.name}
              </span>
              {item.primaryColor && (
                <div className="flex items-center gap-1">
                  <Palette size={12} className="text-gray-500" />
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-1"
                    style={getColorBadgeStyle(item.primaryColor)}
                  >
                    {item.primaryColor}
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1">
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
              
              {item.colorConfidence && item.colorConfidence > 0 && (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                  Color: {Math.round(item.colorConfidence * 100)}%
                </Badge>
              )}
              
              {item.colorExtracted && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  Color Enhanced
                </Badge>
              )}
              
              {item.descriptors && item.descriptors.length > 0 && (
                <>
                  {item.descriptors.slice(0, 2).map((descriptor, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {descriptor}
                    </Badge>
                  ))}
                  {item.descriptors.length > 2 && (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      +{item.descriptors.length - 2}
                    </Badge>
                  )}
                </>
              )}
            </div>

            {item.fullDescription && item.fullDescription !== item.name && (
              <p className="text-xs text-gray-600 mt-1 italic">
                Original: "{item.fullDescription}"
              </p>
            )}
          </div>
        </div>
      ))}
      
      <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
        <div className="flex items-center gap-1 mb-1">
          <Palette size={12} className="text-blue-600" />
          <span className="font-medium">Color Enhancement Active</span>
        </div>
        <p>Items are analyzed with enhanced color detection for more accurate AI image generation.</p>
      </div>
    </div>
  );
};

export default ClothingItemsProcessor;
