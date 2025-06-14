
import React, { useState } from 'react';
import { ClothingItem } from '@/services/wardrobe';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Delete, Edit, Check, Shirt, Image, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Toggle } from '@/components/ui/toggle';
import { generateClothingImage } from '@/services/clothing/aiImageGeneration';
import { getRenderImageUrl, itemNeedsRenderImage } from '@/services/wardrobe/aiImageIntegration';

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
  const [showOriginalThumbnail, setShowOriginalThumbnail] = useState(false);

  const handleUpdate = () => {
    if (name.trim() === '' || category.trim() === '') {
      toast.error('Name and category cannot be empty');
      return;
    }

    onUpdate(item.id, { name, category });
    setIsEditing(false);
    toast.success('Item updated');
  };

  const handleDelete = () => {
    onDelete(item.id);
  };

  // Get the best image to display based on user preference
  const getDisplayImageUrl = () => {
    if (showOriginalThumbnail && originalImageUrl) {
      return originalImageUrl;
    }
    return getRenderImageUrl(item, originalImageUrl);
  };

  const displayImageUrl = getDisplayImageUrl();
  const needsRenderImage = itemNeedsRenderImage(item);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image Section */}
      <div className="relative h-48 bg-gray-100">
        {displayImageUrl ? (
          <div className="relative h-full">
            <img
              src={displayImageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              onLoad={() => {
                console.log('✅ Item image loaded:', displayImageUrl);
              }}
              onError={(e) => {
                console.error('❌ Failed to load item image:', displayImageUrl);
                // Fallback to placeholder
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            
            {/* Image Toggle Controls */}
            {originalImageUrl && (
              <div className="absolute top-2 left-2">
                <div className="flex bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-md">
                  <Toggle
                    pressed={!showOriginalThumbnail}
                    onPressedChange={(pressed) => setShowOriginalThumbnail(!pressed)}
                    className="h-8 px-2 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
                    size="sm"
                  >
                    <Image size={14} />
                  </Toggle>
                  <Toggle
                    pressed={showOriginalThumbnail}
                    onPressedChange={(pressed) => setShowOriginalThumbnail(pressed)}
                    className="h-8 px-2 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-700"
                    size="sm"
                  >
                    <Camera size={14} />
                  </Toggle>
                </div>
              </div>
            )}
            
            {/* AI Generation Status Indicator */}
            {needsRenderImage && !showOriginalThumbnail && (
              <div className="absolute top-2 right-2">
                <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Generating...
                </div>
              </div>
            )}
            
            {/* AI Generated Badge */}
            {item.renderImageUrl && !showOriginalThumbnail && (
              <div className="absolute top-2 right-2">
                <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="text-xs">✨</span>
                  AI Generated
                </div>
              </div>
            )}

            {/* Original Image Badge */}
            {showOriginalThumbnail && originalImageUrl && (
              <div className="absolute top-2 right-2">
                <div className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="text-xs">📷</span>
                  Original
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Shirt size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No image available</p>
              {needsRenderImage && !showOriginalThumbnail && (
                <p className="text-xs text-blue-600 mt-1">AI image generating...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {isEditing ? (
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
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>
                <Check size={16} className="mr-2" />
                Update
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <p className="text-sm text-gray-500">Category: {item.category}</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setIsEditing(true);
                  setName(item.name);
                  setCategory(item.category);
                }}
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
              >
                <Delete size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditableClothingItem;
