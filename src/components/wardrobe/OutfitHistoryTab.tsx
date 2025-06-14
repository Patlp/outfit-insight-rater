
import React from 'react';
import { WardrobeItem } from '@/services/wardrobe';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Star, Eye, Trash2 } from 'lucide-react';
import { deleteWardrobeItem } from '@/services/wardrobe';
import { toast } from 'sonner';
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

interface OutfitHistoryTabProps {
  wardrobeItems: WardrobeItem[];
  onItemsUpdated?: () => void;
}

const OutfitHistoryTab: React.FC<OutfitHistoryTabProps> = ({ 
  wardrobeItems, 
  onItemsUpdated 
}) => {
  const handleDeleteOutfit = async (itemId: string) => {
    try {
      const result = await deleteWardrobeItem(itemId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Outfit deleted successfully');
        onItemsUpdated?.();
      }
    } catch (error) {
      toast.error('Failed to delete outfit');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (wardrobeItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No outfits saved yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Rate your first outfit to start building your outfit history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Outfit History</h2>
          <p className="text-sm text-gray-600">
            Your complete outfit ratings and feedback history
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {wardrobeItems.length} outfit{wardrobeItems.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wardrobeItems.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-gray-100 relative">
              <img
                src={item.image_url}
                alt="Outfit"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              
              <div className="absolute top-2 left-2">
                {item.rating_score && (
                  <Badge className={`text-xs font-semibold ${getScoreColor(item.rating_score)}`}>
                    <Star size={12} className="mr-1" />
                    {item.rating_score}/10
                  </Badge>
                )}
              </div>
              
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="text-xs bg-white/80">
                  <Calendar size={12} className="mr-1" />
                  {formatDate(item.created_at)}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                {item.occasion_context && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Occasion
                    </span>
                    <p className="text-sm text-gray-900 capitalize">
                      {item.occasion_context}
                    </p>
                  </div>
                )}
                
                {item.gender && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Style
                    </span>
                    <p className="text-sm text-gray-900 capitalize">
                      {item.gender}
                    </p>
                  </div>
                )}
              </div>

              {item.feedback && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Feedback
                  </span>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {item.feedback}
                  </p>
                </div>
              )}

              {item.suggestions && item.suggestions.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Suggestions
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.suggestions.slice(0, 2).map((suggestion, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {suggestion}
                      </Badge>
                    ))}
                    {item.suggestions.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.suggestions.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {item.extracted_clothing_items && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Items Detected
                  </span>
                  <p className="text-xs text-gray-600">
                    {Array.isArray(item.extracted_clothing_items) 
                      ? `${item.extracted_clothing_items.length} clothing items identified`
                      : 'AI analysis in progress'
                    }
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye size={14} className="mr-1" />
                  View Details
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Outfit?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this outfit from your history. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteOutfit(item.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OutfitHistoryTab;
