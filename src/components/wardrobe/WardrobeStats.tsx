
import React from 'react';
import { ClothingItem } from './ClothingItemsProcessor';

interface WardrobeStatsProps {
  filteredItemsCount: number;
  totalItemsCount: number;
  allItems: ClothingItem[];
}

const WardrobeStats: React.FC<WardrobeStatsProps> = ({
  filteredItemsCount,
  totalItemsCount,
  allItems
}) => {
  const itemsWithAIImages = allItems.filter(item => item.renderImageUrl).length;
  const itemsWithOriginalImages = allItems.filter(item => item.originalImageUrl).length;

  return (
    <div className="flex justify-between items-center text-sm text-gray-600">
      <span>Showing {filteredItemsCount} of {totalItemsCount} clothing items</span>
      <span>
        {itemsWithAIImages} items have AI images | {' '}
        {itemsWithOriginalImages} items have original images
      </span>
    </div>
  );
};

export default WardrobeStats;
