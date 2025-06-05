
import React from 'react';
import { WardrobeItem } from '@/services/wardrobeService';
import WardrobeItemCard from './WardrobeItemCard';

interface WardrobeGridProps {
  items: WardrobeItem[];
  onItemDeleted: () => void;
}

const WardrobeGrid: React.FC<WardrobeGridProps> = ({ items, onItemDeleted }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <WardrobeItemCard
          key={item.id}
          item={item}
          onDeleted={onItemDeleted}
        />
      ))}
    </div>
  );
};

export default WardrobeGrid;
