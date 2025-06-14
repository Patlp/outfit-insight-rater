
import React, { useState } from 'react';
import { ClothingItem } from '@/services/wardrobe';
import { toast } from 'sonner';
import ItemImageDisplay from './ItemImageDisplay';
import ItemEditForm from './ItemEditForm';
import ItemViewDisplay from './ItemViewDisplay';

interface EditableClothingItemProps {
  item: ClothingItem;
  onUpdate: (id: string, updates: Partial<ClothingItem>) => void;
  onDelete: (id: string) => void;
  originalImageUrl?: string;
}

const EditableClothingItem: React.FC<EditableClothingItemProps> = ({
  item,
  onUpdate,
  onDelete,
  originalImageUrl
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [description, setDescription] = useState(item.description || '');
  const [showOriginalThumbnail, setShowOriginalThumbnail] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | undefined>(item.renderImageUrl);

  const handleUpdate = () => {
    const updates: Partial<ClothingItem> = { 
      name, 
      category,
      description: description.trim() || undefined,
      ...(customImageUrl && { renderImageUrl: customImageUrl })
    };

    onUpdate(item.id, updates);
    setIsEditing(false);
    toast.success('Item updated');
  };

  const handleDelete = () => {
    onDelete(item.id);
  };

  const handleImageUploaded = (imageUrl: string) => {
    setCustomImageUrl(imageUrl);
    toast.success('Image uploaded! Don\'t forget to save your changes.');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description || '');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description || '');
    setCustomImageUrl(item.renderImageUrl);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image Section */}
      <ItemImageDisplay
        item={item}
        originalImageUrl={originalImageUrl}
        showOriginalThumbnail={showOriginalThumbnail}
        onToggleImageView={setShowOriginalThumbnail}
      />

      {/* Content Section */}
      <div className="p-4">
        {isEditing ? (
          <ItemEditForm
            item={item}
            name={name}
            setName={setName}
            category={category}
            setCategory={setCategory}
            description={description}
            setDescription={setDescription}
            customImageUrl={customImageUrl}
            onImageUploaded={handleImageUploaded}
            onUpdate={handleUpdate}
            onCancel={handleCancel}
          />
        ) : (
          <ItemViewDisplay
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

export default EditableClothingItem;
