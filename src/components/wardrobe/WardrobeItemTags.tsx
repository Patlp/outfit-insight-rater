
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { extractClothingItems, categorizeClothingItem } from '@/utils/clothingExtractor';
import { AIClothingItem } from '@/services/clothingExtractionService';
import TaggingLevelIndicator from './TaggingLevelIndicator';

interface WardrobeItemTagsProps {
  feedback?: string | null;
  extractedClothingItems?: any | null;
  itemId: string;
}

const WardrobeItemTags: React.FC<WardrobeItemTagsProps> = ({
  feedback,
  extractedClothingItems,
  itemId
}) => {
  // Extract clothing items from feedback using the regex-based extractor for backward compatibility
  const regexClothingItems = React.useMemo(() => {
    if (!feedback) return [];
    
    const extractedItems = extractClothingItems(feedback);
    console.log('Regex extracted clothing items for item', itemId, ':', extractedItems);
    
    return extractedItems;
  }, [feedback, itemId]);

  // Get AI-extracted clothing items if available
  const aiClothingItems = React.useMemo(() => {
    const aiItems = extractedClothingItems as AIClothingItem[] | null;
    if (aiItems && Array.isArray(aiItems) && aiItems.length > 0) {
      console.log('AI extracted clothing items for item', itemId, ':', aiItems);
      return aiItems;
    }
    return null;
  }, [extractedClothingItems, itemId]);

  // Determine tagging level and display data
  const { displayItems, taggingLevel, averageConfidence } = React.useMemo(() => {
    if (aiClothingItems && aiClothingItems.length > 0) {
      // Determine tagging level based on item properties
      const hasKaggleData = aiClothingItems.some(item => 
        item.source === 'kaggle' || item.source === 'enhanced' || item.source === 'hybrid'
      );
      const hasDescriptors = aiClothingItems.some(item => 
        item.descriptors && item.descriptors.length > 0
      );
      const avgConfidence = aiClothingItems.reduce((sum, item) => sum + item.confidence, 0) / aiClothingItems.length;
      
      let level: 'basic' | 'medium' | 'advanced' = 'medium';
      
      if (hasKaggleData && hasDescriptors && avgConfidence >= 0.7) {
        level = 'advanced';
      } else if (hasDescriptors && avgConfidence >= 0.6) {
        level = 'medium';
      } else {
        level = 'basic';
      }
      
      return {
        displayItems: aiClothingItems,
        taggingLevel: level,
        averageConfidence: avgConfidence
      };
    } else if (regexClothingItems.length > 0) {
      // Convert regex items to display format
      const regexDisplayItems = regexClothingItems.map(item => ({
        name: item,
        descriptors: [],
        category: categorizeClothingItem(item),
        confidence: 0.7
      }));
      
      return {
        displayItems: regexDisplayItems,
        taggingLevel: 'basic' as const,
        averageConfidence: 0.7
      };
    }
    
    return {
      displayItems: [],
      taggingLevel: 'basic' as const,
      averageConfidence: 0
    };
  }, [aiClothingItems, regexClothingItems]);

  // Get category colors for badges
  const getCategoryColor = (itemName: string, category?: string) => {
    const itemCategory = category || categorizeClothingItem(itemName);
    const colorMap = {
      tops: 'bg-blue-100 text-blue-700 border-blue-200',
      bottoms: 'bg-green-100 text-green-700 border-green-200',
      dresses: 'bg-purple-100 text-purple-700 border-purple-200',
      footwear: 'bg-orange-100 text-orange-700 border-orange-200',
      accessories: 'bg-pink-100 text-pink-700 border-pink-200',
      outerwear: 'bg-gray-100 text-gray-700 border-gray-200',
      other: 'bg-fashion-100 text-fashion-700 border-fashion-200'
    };
    return colorMap[itemCategory as keyof typeof colorMap] || colorMap.other;
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
          const descriptors = clothingItem.descriptors || [];
          const confidence = clothingItem.confidence;
          const source = (clothingItem as any).source;
          
          return (
            <Badge
              key={index}
              variant="secondary"
              className={`text-xs ${getCategoryColor(itemName, category)} ${
                source === 'kaggle' || source === 'enhanced' ? 'ring-1 ring-purple-300' : ''
              }`}
              title={descriptors.length > 0 ? 
                `Category: ${category}\nDescriptors: ${descriptors.join(', ')}\nConfidence: ${confidence ? Math.round(confidence * 100) : 'N/A'}%\nLevel: ${taggingLevel}${source ? `\nSource: ${source}` : ''}` : 
                `Category: ${category}\nLevel: ${taggingLevel}${source ? `\nSource: ${source}` : ''}`
              }
            >
              {itemName}
              {(source === 'kaggle' || source === 'enhanced') && (
                <Sparkles size={10} className="ml-1 text-purple-500" />
              )}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default WardrobeItemTags;
