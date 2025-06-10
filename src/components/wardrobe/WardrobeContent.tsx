
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWardrobeItems, WardrobeItem } from '@/services/wardrobeService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WardrobeHeader from './WardrobeHeader';
import WardrobeFilters from './WardrobeFilters';
import WardrobeGrid from './WardrobeGrid';
import WardrobeEmptyState from './WardrobeEmptyState';
import DigitalWardrobeTab from './DigitalWardrobeTab';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const WardrobeContent: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const { data: wardrobeItems, isLoading, error, refetch } = useQuery({
    queryKey: ['wardrobe-items', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const result = await getWardrobeItems(user.id);
      if (result.error) {
        console.error('Error fetching wardrobe items:', result.error);
        toast.error('Failed to load wardrobe items');
        throw new Error(result.error);
      }
      return result.items || [];
    },
    enabled: !!user?.id,
  });

  const filteredItems = React.useMemo(() => {
    if (!wardrobeItems) return [];

    let filtered = wardrobeItems;

    // Filter by search term (searches in suggestions and feedback)
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        const feedbackMatch = item.feedback?.toLowerCase().includes(searchLower);
        const suggestionsMatch = item.suggestions?.some(suggestion => 
          suggestion.toLowerCase().includes(searchLower)
        );
        return feedbackMatch || suggestionsMatch;
      });
    }

    // Filter by rating score
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'high') {
        filtered = filtered.filter(item => (item.rating_score || 0) >= 8);
      } else if (selectedFilter === 'medium') {
        filtered = filtered.filter(item => {
          const score = item.rating_score || 0;
          return score >= 6 && score < 8;
        });
      } else if (selectedFilter === 'low') {
        filtered = filtered.filter(item => (item.rating_score || 0) < 6);
      }
    }

    return filtered;
  }, [wardrobeItems, searchTerm, selectedFilter]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Error loading wardrobe items</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-fashion-500 text-white rounded hover:bg-fashion-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <WardrobeHeader 
        itemCount={wardrobeItems?.length || 0}
        isLoading={isLoading}
      />
      
      <Tabs defaultValue="outfits" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="outfits">Outfit History</TabsTrigger>
          <TabsTrigger value="wardrobe">My Wardrobe</TabsTrigger>
        </TabsList>
        
        <TabsContent value="outfits" className="space-y-6">
          <WardrobeFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-md mb-4"></div>
                  <div className="bg-gray-300 h-4 rounded mb-2"></div>
                  <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <WardrobeGrid items={filteredItems} onItemDeleted={refetch} />
          ) : wardrobeItems && wardrobeItems.length > 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No items match your current filters.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter('all');
                }}
                className="mt-2 text-fashion-500 hover:text-fashion-600"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <WardrobeEmptyState />
          )}
        </TabsContent>
        
        <TabsContent value="wardrobe">
          <DigitalWardrobeTab 
            wardrobeItems={wardrobeItems || []}
            isLoading={isLoading}
            onItemsUpdated={refetch}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WardrobeContent;
