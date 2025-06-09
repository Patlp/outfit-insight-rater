
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Shirt } from 'lucide-react';

interface ClothingItem {
  name: string;
  category: string;
  confidence?: number;
}

interface WardrobeItemCategoriesProps {
  extractedClothingItems?: any | null;
}

const WardrobeItemCategories: React.FC<WardrobeItemCategoriesProps> = ({
  extractedClothingItems
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Process clothing items and group by category
  const clothingItems = React.useMemo(() => {
    if (extractedClothingItems && Array.isArray(extractedClothingItems) && extractedClothingItems.length > 0) {
      return extractedClothingItems.map(item => ({
        name: item.name || 'Unknown Item',
        category: item.category || 'other',
        confidence: item.confidence || 0.8
      }));
    }
    return [];
  }, [extractedClothingItems]);

  // Group items by category
  const itemsByCategory = React.useMemo(() => {
    const grouped: Record<string, ClothingItem[]> = {};
    clothingItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [clothingItems]);

  const getCategoryColor = (category: string) => {
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

  if (clothingItems.length === 0) {
    return null;
  }

  const totalItems = clothingItems.length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Shirt className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Clothing Items</h4>
              <Badge variant="secondary" className="text-xs">
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </Badge>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 capitalize">
                  {category} ({items.length})
                </h5>
                <div className="flex flex-wrap gap-2">
                  {items.map((item, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={`text-xs ${getCategoryColor(category)}`}
                    >
                      {item.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default WardrobeItemCategories;
