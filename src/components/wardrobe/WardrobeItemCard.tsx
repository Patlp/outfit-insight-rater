
import React, { useState } from 'react';
import { WardrobeItem, deleteWardrobeItem } from '@/services/wardrobeService';
import { Star, Trash2, Calendar, Tag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { extractClothingItems, categorizeClothingItem } from '@/utils/clothingExtractor';
import { AIClothingItem } from '@/services/clothingExtractionService';

interface WardrobeItemCardProps {
  item: WardrobeItem;
  onDeleted: () => void;
}

const WardrobeItemCard: React.FC<WardrobeItemCardProps> = ({ item, onDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this outfit?')) {
      setIsDeleting(true);
      try {
        const { error } = await deleteWardrobeItem(item.id);
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Extract clothing items from feedback using the regex-based extractor for backward compatibility
  const regexClothingItems = React.useMemo(() => {
    if (!item.feedback) return [];
    
    const extractedItems = extractClothingItems(item.feedback);
    console.log('Regex extracted clothing items for item', item.id, ':', extractedItems);
    
    return extractedItems;
  }, [item.feedback, item.id]);

  // Get AI-extracted clothing items if available
  const aiClothingItems = React.useMemo(() => {
    const aiItems = item.extracted_clothing_items as AIClothingItem[] | null;
    if (aiItems && Array.isArray(aiItems) && aiItems.length > 0) {
      console.log('AI extracted clothing items for item', item.id, ':', aiItems);
      return aiItems;
    }
    return null;
  }, [item.extracted_clothing_items, item.id]);

  // Use AI items if available, otherwise fall back to regex items
  const displayItems = aiClothingItems || regexClothingItems;
  const isAIExtracted = aiClothingItems !== null;

  // Get category colors for badges
  const getCategoryColor = (itemName: string, category?: string) => {
    const itemCategory = category || categorizeClothingItem(itemName);
    const colorMap = {
      tops: 'bg-blue-100 text-blue-700 border-blue-200',
      bottoms: 'bg-green-100 text-green-700 border-green-200',
      dresses: 'bg-purple-100 text-purple-700 border-purple-200',
      footwear: 'bg-orange-100 text-orange-700 border-orange-200',
      accessories: 'bg-pink-100 text-pink-700 border-pink-200',
      outerwear: 'bg-gray-100 text-gray-700 border-gray-200',
      other: 'bg-fashion-100 text-fashion-700 border-fashion-200'
    };
    return colorMap[itemCategory as keyof typeof colorMap] || colorMap.other;
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={item.image_url}
          alt="Outfit"
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <Star size={14} className={`${getScoreColor(item.rating_score || 0)}`} />
            <span className={`text-sm font-medium ${getScoreColor(item.rating_score || 0)}`}>
              {item.rating_score}/10
            </span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Calendar size={14} />
          {format(new Date(item.created_at), 'MMM dd, yyyy')}
          {item.occasion_context && (
            <>
              <span>•</span>
              <span className="capitalize">{item.occasion_context}</span>
            </>
          )}
        </div>
        
        {item.feedback && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-3">
            {item.feedback}
          </p>
        )}
        
        {displayItems.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            <div className="flex items-center gap-1">
              {isAIExtracted ? (
                <Sparkles size={12} className="text-fashion-500" />
              ) : (
                <Tag size={12} className="text-gray-400" />
              )}
            </div>
            {displayItems.map((clothingItem, index) => {
              // Handle both AI items (objects) and regex items (strings)
              const itemName = typeof clothingItem === 'string' ? clothingItem : clothingItem.name;
              const category = typeof clothingItem === 'object' ? clothingItem.category : undefined;
              const descriptors = typeof clothingItem === 'object' ? clothingItem.descriptors : [];
              
              return (
                <Badge
                  key={index}
                  variant="secondary"
                  className={`text-xs ${getCategoryColor(itemName, category)}`}
                  title={isAIExtracted && descriptors.length > 0 ? `Descriptors: ${descriptors.join(', ')}` : undefined}
                >
                  {itemName}
                </Badge>
              );
            })}
            {isAIExtracted && (
              <Badge variant="outline" className="text-xs text-fashion-600 border-fashion-300">
                AI Enhanced
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
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
      </CardFooter>
    </Card>
  );
};

export default WardrobeItemCard;
