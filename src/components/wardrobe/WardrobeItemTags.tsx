
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Eye, Sparkles, Zap } from 'lucide-react';
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

  // Get AI/Vision-extracted clothing items if available
  const visionClothingItems = React.useMemo(() => {
    const visionItems = extractedClothingItems as AIClothingItem[] | null;
    if (visionItems && Array.isArray(visionItems) && visionItems.length > 0) {
      console.log('Vision/AI extracted clothing items for item', itemId, ':', visionItems);
      return visionItems;
    }
    return null;
  }, [extractedClothingItems, itemId]);

  // Determine tagging level and display data
  const { displayItems, taggingLevel, averageConfidence, extractionMethod } = React.useMemo(() => {
    if (visionClothingItems && visionClothingItems.length > 0) {
      // Determine tagging level based on item properties and source
      const hasGoogleVision = visionClothingItems.some(item => 
        item.source === 'google-vision'
      );
      const hasDescriptors = visionClothingItems.some(item => 
        item.descriptors && item.descriptors.length > 0
      );
      const avgConfidence = visionClothingItems.reduce((sum, item) => sum + item.confidence, 0) / visionClothingItems.length;
      
      let level: 'basic' | 'medium' | 'advanced' = 'medium';
      let method = 'ai-extraction';
      
      if (hasGoogleVision && hasDescriptors && avgConfidence >= 0.7) {
        level = 'advanced';
        method = 'google-vision';
      } else if (hasDescriptors && avgConfidence >= 0.6) {
        level = 'medium';
        method = 'ai-with-validation';
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
    } else if (regexClothingItems.length > 0) {
      // Convert regex items to display format
      const regexDisplayItems = regexClothingItems.map(item => ({
        name: item,
        descriptors: [],
        category: categorizeClothingItem(item),
        confidence: 0.7,
        source: 'regex'
      }));
      
      return {
        displayItems: regexDisplayItems,
        taggingLevel: 'basic' as const,
        averageConfidence: 0.7,
        extractionMethod: 'regex-extraction'
      };
    }
    
    return {
      displayItems: [],
      taggingLevel: 'basic' as const,
      averageConfidence: 0,
      extractionMethod: 'none'
    };
  }, [visionClothingItems, regexClothingItems]);

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

  // Get icon based on extraction method
  const getMethodIcon = (source: string) => {
    if (source === 'google-vision') {
      return <Eye size={10} className="ml-1 text-blue-500" />;
    } else if (source === 'kaggle' || source === 'enhanced') {
      return <Sparkles size={10} className="ml-1 text-purple-500" />;
    } else if (source && source.includes('ai')) {
      return <Zap size={10} className="ml-1 text-green-500" />;
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
          const descriptors = clothingItem.descriptors || [];
          const confidence = clothingItem.confidence;
          const source = (clothingItem as any).source;
          
          return (
            <Badge
              key={index}
              variant="secondary"
              className={`text-xs ${getCategoryColor(itemName, category)} ${
                source === 'google-vision' ? 'ring-1 ring-blue-300' : 
                source === 'kaggle' || source === 'enhanced' ? 'ring-1 ring-purple-300' : ''
              }`}
              title={descriptors.length > 0 ? 
                `Category: ${category}\nDescriptors: ${descriptors.join(', ')}\nConfidence: ${confidence ? Math.round(confidence * 100) : 'N/A'}%\nMethod: ${extractionMethod}${source ? `\nSource: ${source}` : ''}` : 
                `Category: ${category}\nMethod: ${extractionMethod}${source ? `\nSource: ${source}` : ''}`
              }
            >
              {itemName}
              {getMethodIcon(source || '')}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default WardrobeItemTags;
