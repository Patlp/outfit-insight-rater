
import React from 'react';
import { WardrobeItem } from '@/services/wardrobe';
import WardrobeItemCard from './WardrobeItemCard';

interface WardrobeGridProps {
  items: WardrobeItem[];
  onItemDeleted: () => void;
}

const WardrobeGrid: React.FC<WardrobeGridProps> = ({ items, onItemDeleted }) => {
  console.log('🔍 WardrobeGrid rendering with items:', items.length);
  console.log('📋 Items data:', items);

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No outfits found in your wardrobe.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        console.log('🎨 Rendering outfit item:', {
          id: item.id,
          imageUrl: item.image_url,
          rating: item.rating_score,
          hasFeedback: !!item.feedback
        });
        
        return (
          <WardrobeItemCard
            key={item.id}
            item={item}
            onDeleted={onItemDeleted}
          />
        );
      })}
    </div>
  );
};

export default WardrobeGrid;
