
import React from 'react';
import { ClothingItem } from './ClothingItemsProcessor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shirt, Star, Calendar, Palette, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ItemViewDisplayProps {
  item: ClothingItem;
  onEdit?: (item: ClothingItem) => void;
  onDelete?: (itemId: string) => void;
}

const ItemViewDisplay: React.FC<ItemViewDisplayProps> = ({ 
  item, 
  onEdit, 
  onDelete 
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };

  console.log('🔍 ItemViewDisplay rendering item:', {
    id: item.id,
    name: item.name,
    hasRenderImage: !!item.renderImageUrl,
    hasOriginalImage: !!item.originalImageUrl,
    originalImageUrl: item.originalImageUrl
  });

  return (
    <div className="space-y-4">
      {/* Header with title and action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shirt size={20} className="text-fashion-600" />
          <h3 className="text-lg font-semibold capitalize">{item.name}</h3>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              className="h-8 w-8 p-0"
            >
              <Edit size={14} />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Item Details */}
      <div className="space-y-3">
        {/* Category */}
        {item.category && (
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-gray-500" />
            <Badge variant="secondary" className="capitalize">
              {item.category}
            </Badge>
          </div>
        )}

        {/* Outfit Rating */}
        {item.outfitRating && item.outfitRating > 0 && (
          <div className="flex items-center gap-2">
            <Star size={16} className="text-yellow-500" />
            <span className="text-sm text-gray-700">
              Outfit rated <span className="font-semibold">{item.outfitRating}/10</span>
            </span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-500" />
          <span className="text-sm text-gray-600">
            Added {formatDate(item.createdAt)}
          </span>
        </div>

        {/* Descriptors */}
        {item.descriptors && item.descriptors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Style Details</h4>
            <div className="flex flex-wrap gap-1">
              {item.descriptors.slice(0, 4).map((descriptor, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {descriptor}
                </Badge>
              ))}
              {item.descriptors.length > 4 && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  +{item.descriptors.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {item.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemViewDisplay;
