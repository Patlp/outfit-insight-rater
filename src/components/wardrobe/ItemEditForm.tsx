
import React from 'react';
import { ClothingItem } from './ClothingItemsProcessor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploadField from './ImageUploadField';
import { Textarea } from '@/components/ui/textarea';

interface ItemEditFormProps {
  item: ClothingItem;
  name: string;
  setName: (name: string) => void;
  category: string;
  setCategory: (category: string) => void;
  description: string;
  setDescription: (description: string) => void;
  customImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  onUpdate: () => void;
  onCancel: () => void;
}

const ItemEditForm: React.FC<ItemEditFormProps> = ({
  item,
  name,
  setName,
  category,
  setCategory,
  description,
  setDescription,
  customImageUrl,
  onImageUploaded,
  onUpdate,
  onCancel
}) => {
  const handleUpdate = () => {
    if (name.trim() === '' || category.trim() === '') {
      toast.error('Name and category cannot be empty');
      return;
    }
    onUpdate();
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          type="text"
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description (season, brand, etc.)</Label>
        <Textarea
          id="description"
          placeholder="Add additional details like season, brand, fit, or other information"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[80px] resize-y"
        />
      </div>
      
      {/* Image Upload Field */}
      <ImageUploadField
        currentImageUrl={customImageUrl || item.renderImageUrl}
        itemName={name}
        wardrobeItemId={item.outfitId}
        onImageUploaded={onImageUploaded}
      />
      
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleUpdate}>
          <Check size={16} className="mr-2" />
          Update
        </Button>
      </div>
    </div>
  );
};

export default ItemEditForm;
