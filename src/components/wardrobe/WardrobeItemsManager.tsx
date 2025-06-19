
import { useState, useMemo, useEffect } from 'react';
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

interface WardrobeItemsManagerProps {
  wardrobeItems: WardrobeItem[];
  onItemsUpdated?: () => void;
  children: (props: {
    allClothingItems: ClothingItem[];
    categories: string[];
    filteredAndSortedItems: ClothingItem[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    filterCategory: string;
    setFilterCategory: (category: string) => void;
    handleItemUpdate: (itemId: string, updates: Partial<ClothingItem>) => Promise<void>;
    handleItemDelete: (itemId: string) => Promise<void>;
    handleAddItem: () => void;
    handleBulkUploadComplete: () => void;
    handleClearFilters: () => void;
  }) => React.ReactNode;
}

export const WardrobeItemsManager: React.FC<WardrobeItemsManagerProps> = ({
  wardrobeItems,
  onItemsUpdated,
  children
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [localWardrobeItems, setLocalWardrobeItems] = useState<WardrobeItem[]>(wardrobeItems);

  // Update local state when wardrobeItems prop changes
  useEffect(() => {
    console.log('🔄 WardrobeItemsManager: wardrobeItems updated', wardrobeItems.length);
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
    console.log('🔄 Processing wardrobe items for clothing extraction...');
    const items = processWardrobeItems(localWardrobeItems);
    console.log('📊 Extracted clothing items:', items.length);
    
    // Log some sample items for debugging
    if (items.length > 0) {
      console.log('🔍 Sample extracted items:', items.slice(0, 3).map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        hasRenderImage: !!item.renderImageUrl,
        hasOriginalImage: !!item.originalImageUrl
      })));
    }
    
    return items;
  }, [localWardrobeItems]);

  // Get unique categories for filtering
  const categories = useMemo(() => {
    const uniqueCategories = getUniqueCategories(allClothingItems);
    console.log('📂 Available categories:', uniqueCategories);
    return uniqueCategories;
  }, [allClothingItems]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    const filtered = filterAndSortItems(allClothingItems, searchTerm, filterCategory, sortBy);
    console.log('🔍 Filtered items:', filtered.length, 'from', allClothingItems.length);
    return filtered;
  }, [allClothingItems, searchTerm, filterCategory, sortBy]);

  const handleItemUpdate = async (itemId: string, updates: Partial<ClothingItem>) => {
    try {
      console.log('🔄 Updating item with ID:', itemId, 'Updates:', updates);
      
      // Parse the itemId to get outfitId and arrayIndex
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

      // Create updated clothing items array
      const updatedClothingItems = [...wardrobeItem.extracted_clothing_items];
      updatedClothingItems[arrayIndex] = {
        ...updatedClothingItems[arrayIndex],
        ...updates
      };

      console.log(`📝 Updated item at index ${arrayIndex}:`, updatedClothingItems[arrayIndex]);

      // Update the database
      const { error } = await supabase
        .from('wardrobe_items')
        .update({
          extracted_clothing_items: updatedClothingItems,
          updated_at: new Date().toISOString()
        })
        .eq('id', outfitId);

      if (error) {
        console.error('❌ Database error updating clothing item:', error);
        toast.error('Failed to update item in database');
        return;
      }

      console.log('✅ Clothing item updated successfully in database');
      toast.success('Item updated successfully');
      
      // Refresh the wardrobe items
      if (onItemsUpdated) {
        console.log('🔄 Refreshing wardrobe items...');
        onItemsUpdated();
      }

    } catch (error) {
      console.error('❌ Error in handleItemUpdate:', error);
      toast.error('Failed to update item');
    }
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

  // Debug logging
  useEffect(() => {
    console.log('📊 WardrobeItemsManager state:', {
      totalWardrobeItems: localWardrobeItems.length,
      totalClothingItems: allClothingItems.length,
      filteredItems: filteredAndSortedItems.length,
      searchTerm,
      filterCategory,
      sortBy,
      categories: categories.length
    });
  }, [localWardrobeItems, allClothingItems, filteredAndSortedItems, searchTerm, filterCategory, sortBy, categories]);

  return (
    <>
      {children({
        allClothingItems,
        categories,
        filteredAndSortedItems,
        searchTerm,
        setSearchTerm,
        sortBy,
        setSortBy,
        filterCategory,
        setFilterCategory,
        handleItemUpdate,
        handleItemDelete,
        handleAddItem,
        handleBulkUploadComplete,
        handleClearFilters
      })}
    </>
  );
};

export default WardrobeItemsManager;
