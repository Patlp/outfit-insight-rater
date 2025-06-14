
import React from 'react';
import { ClothingItem } from '@/services/wardrobe/types';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, Tag } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold leading-tight text-gray-900">{item.name}</h3>
        <div className="flex items-center gap-1">
          <Tag size={14} className="text-gray-500" />
          <p className="text-sm text-gray-500">{item.category}</p>
        </div>
        
        {item.description && (
          <p className="text-sm text-gray-600 mt-2 border-t border-gray-100 pt-2">
            {item.description}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash size={14} className="mr-1 text-red-500" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{item.name}&quot; from your wardrobe.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="default" size="sm" onClick={onEdit}>
          <Pencil size={14} className="mr-1" />
          Edit
        </Button>
      </div>
    </div>
  );
};

export default ItemViewDisplay;
