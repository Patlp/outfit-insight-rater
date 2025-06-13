
import React from 'react';
import { ClothingItem } from './ClothingItemsProcessor';
import EditableClothingItem from './EditableClothingItem';

interface WardrobeItemsGridProps {
  items: ClothingItem[];
  onUpdate: (itemId: string, updates: Partial<ClothingItem>) => void;
  onDelete: (itemId: string) => Promise<void>;
  onClearFilters: () => void;
}

const WardrobeItemsGrid: React.FC<WardrobeItemsGridProps> = ({
  items,
  onUpdate,
  onDelete,
  onClearFilters
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No clothing items match your current filters.</p>
        <button
          onClick={onClearFilters}
          className="mt-2 text-fashion-500 hover:text-fashion-600"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <EditableClothingItem
          key={item.id}
          item={item}
          onUpdate={onUpdate}
          onDelete={onDelete}
          originalImageUrl={item.originalImageUrl}
        />
      ))}
    </div>
  );
};

export default WardrobeItemsGrid;
