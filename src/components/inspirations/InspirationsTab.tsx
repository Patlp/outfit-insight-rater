
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OutfitInspiration } from '@/services/inspirations/types';
import { getOutfitInspirations } from '@/services/inspirations/inspirationService';
import InspirationImportDialog from './InspirationImportDialog';
import InspirationCard from './InspirationCard';
import { toast } from 'sonner';
import { Loader2, Image } from 'lucide-react';

const InspirationsTab: React.FC = () => {
  const { user } = useAuth();
  const [inspirations, setInspirations] = useState<OutfitInspiration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInspirations = async () => {
    if (!user) return;

    try {
      const result = await getOutfitInspirations(user.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setInspirations(result.inspirations || []);
      }
    } catch (error) {
      toast.error('Failed to fetch inspirations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInspirations();
  }, [user]);

  const handleInspirationAdded = () => {
    fetchInspirations();
  };

  const handleInspirationDeleted = () => {
    fetchInspirations();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Outfit Inspirations</h2>
          <p className="text-sm text-gray-600">
            Import outfit ideas from Pinterest or upload your own photos
          </p>
        </div>
        <InspirationImportDialog onInspirationAdded={handleInspirationAdded} />
      </div>

      {inspirations.length === 0 ? (
        <div className="text-center py-12">
          <Image className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No inspirations yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by importing an outfit from Pinterest or uploading a photo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {inspirations.map((inspiration) => (
            <InspirationCard
              key={inspiration.id}
              inspiration={inspiration}
              onDelete={handleInspirationDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InspirationsTab;
