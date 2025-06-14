
import React from 'react';
import { ClothingItem } from './ClothingItemsProcessor';
import { Button } from '@/components/ui/button';
import { Edit, Delete } from 'lucide-react';

interface ItemViewDisplayProps {
  item: ClothingItem;
  onEdit: () => void;
  onDelete: () => void;
}

const ItemViewDisplay: React.FC<ItemViewDisplayProps> = ({
  item,
  onEdit,
  onDelete
}) => {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg">{item.name}</h3>
      <p className="text-sm text-gray-500">Category: {item.category}</p>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onEdit}
        >
          <Edit size={16} />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={onDelete}
        >
          <Delete size={16} />
        </Button>
      </div>
    </div>
  );
};

export default ItemViewDisplay;
