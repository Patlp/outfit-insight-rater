
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Edit2, Trash2, Save, X, Shirt } from 'lucide-react';
import { toast } from 'sonner';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  confidence: number;
  source: string;
  outfitId: string;
  outfitDate: string;
  outfitScore: number;
  originalImageUrl?: string; // Use original image instead of cropped
}

interface EditableClothingItemProps {
  item: ClothingItem;
  onUpdate: (itemId: string, updates: Partial<ClothingItem>) => void;
  onDelete: (itemId: string) => void;
  originalImageUrl?: string; // Original outfit image
}

const EditableClothingItem: React.FC<EditableClothingItemProps> = ({
  item,
  onUpdate,
  onDelete,
  originalImageUrl
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [editedCategory, setEditedCategory] = useState(item.category);

  const handleSave = () => {
    if (editedName.trim().length < 2) {
      toast.error('Item name must be at least 2 characters');
      return;
    }

    onUpdate(item.id, {
      name: editedName.trim(),
      category: editedCategory
    });
    setIsEditing(false);
    toast.success('Item updated successfully');
  };

  const handleCancel = () => {
    setEditedName(item.name);
    setEditedCategory(item.category);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const imageToDisplay = originalImageUrl || item.originalImageUrl;
  console.log(`Rendering item "${item.name}" with original image:`, imageToDisplay);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <AspectRatio ratio={4/5} className="bg-gray-100 overflow-hidden">
          {imageToDisplay ? (
            <img
              src={imageToDisplay}
              alt={item.name}
              className="w-full h-full object-contain bg-white"
              onLoad={() => {
                console.log(`✅ Successfully loaded image for "${item.name}"`);
              }}
              onError={(e) => {
                console.error(`❌ Failed to load image for "${item.name}":`, imageToDisplay);
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.classList.remove('hidden');
                }
              }}
            />
          ) : null}
          
          {/* Fallback placeholder */}
          <div className={`absolute inset-0 flex items-center justify-center bg-gray-200 ${imageToDisplay ? 'hidden' : ''}`}>
            <Shirt size={32} className="text-gray-400" />
          </div>

          {/* Source badge */}
          <div className="absolute top-2 left-2">
            <Badge variant={item.source === 'ai' ? 'default' : 'secondary'} className="text-xs">
              {item.source === 'ai' ? 'AI' : 'Manual'}
            </Badge>
          </div>

          {/* Confidence score for AI items */}
          {item.source === 'ai' && (
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-xs bg-white/90">
                {Math.round(item.confidence * 100)}%
              </Badge>
            </div>
          )}
        </AspectRatio>
      </div>

      <CardContent className="p-4 space-y-3">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Item name"
              className="font-medium"
            />
            
            <Select value={editedCategory} onValueChange={setEditedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tops">Tops</SelectItem>
                <SelectItem value="bottoms">Bottoms</SelectItem>
                <SelectItem value="dresses">Dresses</SelectItem>
                <SelectItem value="outerwear">Outerwear</SelectItem>
                <SelectItem value="footwear">Footwear</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="flex-1">
                <Save size={14} className="mr-1" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
                <X size={14} className="mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-gray-900 line-clamp-2">{item.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{item.category}</p>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>From outfit: {formatDate(item.outfitDate)}</p>
              {item.outfitScore > 0 && (
                <p>Outfit score: {item.outfitScore}/10</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setIsEditing(true)} 
                variant="outline" 
                size="sm" 
                className="flex-1"
              >
                <Edit2 size={14} className="mr-1" />
                Edit
              </Button>
              <Button 
                onClick={handleDelete} 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EditableClothingItem;
