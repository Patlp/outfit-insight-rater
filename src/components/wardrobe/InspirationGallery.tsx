
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getOutfitInspirations, deleteOutfitInspiration } from '@/services/outfitInspiration';
import { toast } from 'sonner';

const InspirationGallery: React.FC = () => {
  const { user } = useAuth();

  const { data: inspirations, isLoading, refetch } = useQuery({
    queryKey: ['outfit-inspirations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('🔄 Fetching outfit inspirations for user:', user.id);
      const result = await getOutfitInspirations(user.id);
      
      if (result.error) {
        console.error('❌ Error fetching inspirations:', result.error);
        toast.error('Failed to load inspirations');
        return [];
      }
      
      console.log('✅ Fetched inspirations:', result.inspirations?.length || 0);
      return result.inspirations || [];
    },
    enabled: !!user?.id,
  });

  const handleDelete = async (inspirationId: string) => {
    try {
      console.log('🗑️ Deleting inspiration:', inspirationId);
      const result = await deleteOutfitInspiration(inspirationId);
      
      if (result.error) {
        toast.error('Failed to delete inspiration');
      } else {
        toast.success('Inspiration deleted successfully');
        refetch();
      }
    } catch (error) {
      console.error('❌ Error deleting inspiration:', error);
      toast.error('Failed to delete inspiration');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <div className="bg-gray-300 h-48 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="bg-gray-300 h-4 rounded mb-2"></div>
              <div className="bg-gray-300 h-3 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!inspirations || inspirations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No inspirations yet
          </h3>
          <p className="text-gray-500">
            Import Pinterest boards or upload photos to start building your inspiration collection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Inspiration Collection ({inspirations.length})
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inspirations.map((inspiration) => (
          <Card key={inspiration.id} className="group hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={inspiration.image_url}
                alt={inspiration.title || 'Outfit inspiration'}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(inspiration.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                    {inspiration.title || 'Untitled'}
                  </h4>
                  <p className="text-sm text-gray-500 mb-2 capitalize">
                    {inspiration.source_type} inspiration
                  </p>
                  {inspiration.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {inspiration.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    Added {new Date(inspiration.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {inspiration.source_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a 
                      href={inspiration.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InspirationGallery;
