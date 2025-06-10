
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit2, Save, X, Trash2, Upload } from 'lucide-react';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  confidence: number;
  source: string;
  outfitId: string;
  outfitDate: string;
  outfitScore: number;
}

interface EditableClothingItemProps {
  item: ClothingItem;
  onUpdate: (itemId: string, updates: Partial<ClothingItem>) => void;
  onDelete: (itemId: string) => void;
}

const EditableClothingItem: React.FC<EditableClothingItemProps> = ({
  item,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [editedCategory, setEditedCategory] = useState(item.category);

  const getCategoryColor = (category: string) => {
    const colorMap = {
      tops: 'bg-blue-100 text-blue-700 border-blue-200',
      bottoms: 'bg-green-100 text-green-700 border-green-200',
      dresses: 'bg-purple-100 text-purple-700 border-purple-200',
      footwear: 'bg-orange-100 text-orange-700 border-orange-200',
      accessories: 'bg-pink-100 text-pink-700 border-pink-200',
      outerwear: 'bg-gray-100 text-gray-700 border-gray-200',
      other: 'bg-fashion-100 text-fashion-700 border-fashion-200'
    };
    return colorMap[category as keyof typeof colorMap] || colorMap.other;
  };

  const handleSave = () => {
    onUpdate(item.id, {
      name: editedName,
      category: editedCategory
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(item.name);
    setEditedCategory(item.category);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this item from your wardrobe?')) {
      onDelete(item.id);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        {isEditing ? (
          <div className="flex-1 space-y-2 mr-2">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Item name"
              className="text-sm"
            />
            <Input
              value={editedCategory}
              onChange={(e) => setEditedCategory(e.target.value)}
              placeholder="Category"
              className="text-sm"
            />
          </div>
        ) : (
          <>
            <h3 className="font-medium text-gray-900 text-sm leading-tight">
              {item.name}
            </h3>
            <Badge
              variant="secondary"
              className={`text-xs ${getCategoryColor(item.category)} ml-2 flex-shrink-0`}
            >
              {item.category}
            </Badge>
          </>
        )}
      </div>

      {isEditing ? (
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            onClick={handleSave}
            className="flex-1"
          >
            <Save size={14} className="mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            <X size={14} className="mr-1" />
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2 text-xs text-gray-500 mb-3">
            <div className="flex justify-between">
              <span>From outfit:</span>
              <span className="font-medium">{item.outfitScore}/10</span>
            </div>
            <div className="flex justify-between">
              <span>Added:</span>
              <span>{new Date(item.outfitDate).toLocaleDateString()}</span>
            </div>
            {item.source === 'openai-vision' && (
              <div className="flex items-center gap-1 text-blue-600">
                <span>AI Vision</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="flex-1 text-xs"
            >
              <Edit2 size={12} className="mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={12} className="mr-1" />
              Delete
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default EditableClothingItem;
