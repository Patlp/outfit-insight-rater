
import React from 'react';
import WardrobeItemCategories from './WardrobeItemCategories';

interface WardrobeItemTagsProps {
  feedback?: string | null;
  extractedClothingItems?: any | null;
  itemId: string;
}

const WardrobeItemTags: React.FC<WardrobeItemTagsProps> = ({
  extractedClothingItems,
  itemId
}) => {
  return (
    <WardrobeItemCategories extractedClothingItems={extractedClothingItems} />
  );
};

export default WardrobeItemTags;
