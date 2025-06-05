
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteWardrobeItem } from '@/services/wardrobeService';
import { toast } from 'sonner';

interface WardrobeItemActionsProps {
  itemId: string;
  onDeleted: () => void;
}

const WardrobeItemActions: React.FC<WardrobeItemActionsProps> = ({ itemId, onDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this outfit?')) {
      setIsDeleting(true);
      try {
        const { error } = await deleteWardrobeItem(itemId);
        if (error) {
          console.error('Error deleting item:', error);
          toast.error('Failed to delete outfit');
        } else {
          toast.success('Outfit deleted successfully');
          onDeleted();
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Failed to delete outfit');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      {isDeleting ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
      ) : (
        <Trash2 size={14} />
      )}
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  );
};

export default WardrobeItemActions;
