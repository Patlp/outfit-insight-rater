
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Eye, Sparkles } from 'lucide-react';
import TaggingLevelIndicator from './TaggingLevelIndicator';

interface WardrobeItemTagsProps {
  feedback?: string | null;
  extractedClothingItems?: any | null;
  itemId: string;
}

const WardrobeItemTags: React.FC<WardrobeItemTagsProps> = ({
  extractedClothingItems,
  itemId
}) => {
  // Get vision-extracted clothing items
  const visionClothingItems = React.useMemo(() => {
    if (extractedClothingItems && Array.isArray(extractedClothingItems) && extractedClothingItems.length > 0) {
      console.log('Vision extracted clothing items for item', itemId, ':', extractedClothingItems);
      return extractedClothingItems;
    }
    return [];
  }, [extractedClothingItems, itemId]);

  // Determine tagging level and display data
  const { displayItems, taggingLevel, averageConfidence, extractionMethod } = React.useMemo(() => {
    if (visionClothingItems.length > 0) {
      const hasVisionTags = visionClothingItems.some(item => 
        item.source === 'openai-vision'
      );
      
      const avgConfidence = visionClothingItems.reduce((sum, item) => sum + (item.confidence || 0.8), 0) / visionClothingItems.length;
      
      let level: 'basic' | 'medium' | 'advanced' = 'advanced';
      let method = 'openai-vision';
      
      if (hasVisionTags && avgConfidence >= 0.85) {
        level = 'advanced';
        method = 'openai-vision';
      } else if (avgConfidence >= 0.7) {
        level = 'medium';
        method = 'ai-enhanced';
      } else {
        level = 'basic';
        method = 'basic-ai';
      }
      
      return {
        displayItems: visionClothingItems,
        taggingLevel: level,
        averageConfidence: avgConfidence,
        extractionMethod: method
      };
    }
    
    return {
      displayItems: [],
      taggingLevel: 'basic' as const,
      averageConfidence: 0,
      extractionMethod: 'none'
    };
  }, [visionClothingItems]);

  // Get category colors for badges
  const getCategoryColor = (itemName: string, category?: string) => {
    const colorMap = {
      tops: 'bg-blue-100 text-blue-700 border-blue-200',
      bottoms: 'bg-green-100 text-green-700 border-green-200',
      dresses: 'bg-purple-100 text-purple-700 border-purple-200',
      footwear: 'bg-orange-100 text-orange-700 border-orange-200',
      accessories: 'bg-pink-100 text-pink-700 border-pink-200',
      outerwear: 'bg-gray-100 text-gray-700 border-gray-200',
      other: 'bg-fashion-100 text-fashion-700 border-fashion-200'
    };
    return colorMap[category as keyof typeof colorMap] || colorMap.other;
  };

  // Get icon based on extraction method
  const getMethodIcon = (source: string) => {
    if (source === 'openai-vision') {
      return <Eye size={10} className="ml-1 text-blue-500" />;
    } else if (source === 'enhanced' || source === 'ai-enhanced') {
      return <Sparkles size={10} className="ml-1 text-purple-500" />;
    }
    return null;
  };

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-3">
      <TaggingLevelIndicator 
        level={taggingLevel}
        itemCount={displayItems.length}
        averageConfidence={averageConfidence}
      />
      
      <div className="flex flex-wrap gap-1">
        {displayItems.map((clothingItem, index) => {
          const itemName = clothingItem.name;
          const category = clothingItem.category;
          const confidence = clothingItem.confidence || 0.8;
          const source = clothingItem.source || 'ai';
          
          return (
            <Badge
              key={index}
              variant="secondary"
              className={`text-xs ${getCategoryColor(itemName, category)} ${
                source === 'openai-vision' ? 'ring-2 ring-blue-400' : 
                source === 'enhanced' ? 'ring-1 ring-purple-300' : ''
              }`}
              title={`Category: ${category}
Confidence: ${Math.round(confidence * 100)}%
Method: ${extractionMethod}
Source: ${source}`}
            >
              {itemName}
              {getMethodIcon(source)}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default WardrobeItemTags;
