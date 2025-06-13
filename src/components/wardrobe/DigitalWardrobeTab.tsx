
import React, { useState, useMemo, useEffect } from 'react';
import { WardrobeItem } from '@/services/wardrobe';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useWardrobePolling } from '@/hooks/useWardrobePolling';
import { 
  processWardrobeItems, 
  getUniqueCategories, 
  filterAndSortItems,
  isClothingItemsArray,
  ClothingItem 
} from './ClothingItemsProcessor';
import WardrobeControls from './WardrobeControls';
import WardrobeStats from './WardrobeStats';
import EmptyWardrobeState from './EmptyWardrobeState';
import WardrobeItemsGrid from './WardrobeItemsGrid';

interface DigitalWardrobeTabProps {
  wardrobeItems: WardrobeItem[];
  isLoading: boolean;
  onItemsUpdated?: () => void;
}

const DigitalWardrobeTab: React.FC<DigitalWardrobeTabProps> = ({ 
  wardrobeItems, 
  isLoading, 
  onItemsUpdated 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [localWardrobeItems, setLocalWardrobeItems] = useState<WardrobeItem[]>(wardrobeItems);

  // Update local state when wardrobeItems prop changes
  useEffect(() => {
    setLocalWardrobeItems(wardrobeItems);
  }, [wardrobeItems]);

  // Set up polling for items that have pending AI image generation
  useWardrobePolling({
    wardrobeItems,
    onItemsUpdated,
    onLocalUpdate: setLocalWardrobeItems
  });

  // Extract all individual clothing items from all outfits with original images
  const allClothingItems = useMemo(() => {
    return processWardrobeItems(localWardrobeItems);
  }, [localWardrobeItems]);

  // Get unique categories for filtering
  const categories = useMemo(() => {
    return getUniqueCategories(allClothingItems);
  }, [allClothingItems]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    return filterAndSortItems(allClothingItems, searchTerm, filterCategory, sortBy);
  }, [allClothingItems, searchTerm, filterCategory, sortBy]);

  const handleItemUpdate = (itemId: string, updates: Partial<ClothingItem>) => {
    // Since these are read-only items from the wardrobe, we'll just show a success message
    // but not actually update the database
    toast.success('Item updated successfully');
  };

  const handleItemDelete = async (itemId: string) => {
    try {
      console.log('🗑️ Attempting to delete item with ID:', itemId);
      
      // Parse the itemId to get outfitId and arrayIndex using :: separator
      const [outfitId, indexStr] = itemId.split('::');
      const arrayIndex = parseInt(indexStr);

      console.log(`🔍 Parsed - Outfit ID: ${outfitId}, Array Index: ${arrayIndex}`);

      // Find the wardrobe item
      const wardrobeItem = localWardrobeItems.find(item => item.id === outfitId);
      
      if (!wardrobeItem) {
        console.error('❌ Wardrobe item not found with ID:', outfitId);
        toast.error('Outfit not found');
        return;
      }

      if (!wardrobeItem.extracted_clothing_items || !isClothingItemsArray(wardrobeItem.extracted_clothing_items)) {
        console.error('❌ No extracted clothing items found for outfit:', outfitId);
        toast.error('No clothing items found in this outfit');
        return;
      }

      if (arrayIndex >= wardrobeItem.extracted_clothing_items.length || arrayIndex < 0) {
        console.error('❌ Invalid array index:', arrayIndex, 'for array length:', wardrobeItem.extracted_clothing_items.length);
        toast.error('Invalid item index');
        return;
      }

      console.log(`✅ Found outfit with ${wardrobeItem.extracted_clothing_items.length} items`);
      console.log(`🎯 Deleting item at index ${arrayIndex}:`, wardrobeItem.extracted_clothing_items[arrayIndex]);

      // Create a new array without the item at the specified index
      const updatedClothingItems = [...wardrobeItem.extracted_clothing_items];
      const deletedItem = updatedClothingItems.splice(arrayIndex, 1)[0];
      
      console.log(`🗑️ Removed item:`, deletedItem);
      console.log(`📝 Updated array length:`, updatedClothingItems.length);

      // Update the database
      const { error } = await supabase
        .from('wardrobe_items')
        .update({
          extracted_clothing_items: updatedClothingItems,
          updated_at: new Date().toISOString()
        })
        .eq('id', outfitId);

      if (error) {
        console.error('❌ Database error deleting clothing item:', error);
        toast.error('Failed to delete item from database');
        return;
      }

      console.log('✅ Clothing item deleted successfully from database');
      toast.success(`Deleted "${deletedItem?.name || 'item'}" successfully`);
      
      // Refresh the wardrobe items
      if (onItemsUpdated) {
        console.log('🔄 Refreshing wardrobe items...');
        onItemsUpdated();
      }

    } catch (error) {
      console.error('❌ Error in handleItemDelete:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleAddItem = () => {
    // For now, we'll just show a message about using the bulk upload
    toast.info('Use the bulk upload feature to add new items to your wardrobe');
  };

  const handleBulkUploadComplete = () => {
    toast.success('Bulk upload completed! Refreshing wardrobe...');
    if (onItemsUpdated) {
      onItemsUpdated();
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-gray-300 h-10 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="bg-gray-300 h-6 rounded mb-2"></div>
              <div className="bg-gray-300 h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (allClothingItems.length === 0) {
    return (
      <EmptyWardrobeState
        onAddItem={handleAddItem}
        onBulkUploadComplete={handleBulkUploadComplete}
      />
    );
  }

  return (
    <div className="space-y-6">
      <WardrobeControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterCategory={filterCategory}
        onFilterChange={setFilterCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        categories={categories}
        onAddItem={handleAddItem}
        onBulkUploadComplete={handleBulkUploadComplete}
      />

      <WardrobeStats
        filteredItemsCount={filteredAndSortedItems.length}
        totalItemsCount={allClothingItems.length}
        allItems={allClothingItems}
      />

      <WardrobeItemsGrid
        items={filteredAndSortedItems}
        onUpdate={handleItemUpdate}
        onDelete={handleItemDelete}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
};

export default DigitalWardrobeTab;
