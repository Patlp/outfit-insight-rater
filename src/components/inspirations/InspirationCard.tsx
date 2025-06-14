
import React from 'react';
import { OutfitInspiration } from '@/services/inspirations/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash, ExternalLink, Upload } from 'lucide-react';
import { deleteOutfitInspiration } from '@/services/inspirations/inspirationService';
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

interface InspirationCardProps {
  inspiration: OutfitInspiration;
  onDelete?: () => void;
}

const InspirationCard: React.FC<InspirationCardProps> = ({
  inspiration,
  onDelete
}) => {
  const handleDelete = async () => {
    try {
      const result = await deleteOutfitInspiration(inspiration.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Inspiration deleted successfully');
        onDelete?.();
      }
    } catch (error) {
      toast.error('Failed to delete inspiration');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 relative">
        <img
          src={inspiration.image_url}
          alt={inspiration.title || 'Outfit inspiration'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs">
            {inspiration.source_type === 'pinterest' ? (
              <ExternalLink size={12} className="mr-1" />
            ) : (
              <Upload size={12} className="mr-1" />
            )}
            {inspiration.source_type}
          </Badge>
        </div>
        
        <div className="absolute top-2 right-2">
          <Badge className={`text-xs ${getStatusColor(inspiration.processing_status)}`}>
            {inspiration.processing_status}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2">
            {inspiration.title || 'Untitled Inspiration'}
          </h3>
          
          {inspiration.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {inspiration.description}
            </p>
          )}
          
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-gray-500">
              {new Date(inspiration.created_at).toLocaleDateString()}
            </span>
            
            <div className="flex gap-2">
              {inspiration.source_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(inspiration.source_url, '_blank')}
                >
                  <ExternalLink size={14} />
                </Button>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash size={14} className="text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Inspiration?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this inspiration. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InspirationCard;
