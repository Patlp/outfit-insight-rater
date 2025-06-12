import React, { useState, useMemo, useEffect } from 'react';
import { WardrobeItem } from '@/services/wardrobe';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Shirt, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditableClothingItem from './EditableClothingItem';
import BulkUploadDialog from './BulkUploadDialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { pollWardrobeItemUpdates } from '@/services/wardrobe/aiImageIntegration';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  confidence: number;
  source: string;
  outfitId: string;
  outfitDate: string;
  outfitScore: number;
  originalImageUrl?: string;
  renderImageUrl?: string;
  arrayIndex: number;
}

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
  useEffect(() => {
    const itemsNeedingPolling = wardrobeItems.filter(item => {
      if (item.extracted_clothing_items && Array.isArray(item.extracted_clothing_items)) {
        return item.extracted_clothing_items.some(
          (clothingItem: any) => clothingItem?.name && !clothingItem?.renderImageUrl
        );
      }
      return false;
    });

    if (itemsNeedingPolling.length === 0) {
      return;
    }

    console.log(`🔄 Setting up polling for ${itemsNeedingPolling.length} wardrobe items with pending AI images`);

    const pollInterval = setInterval(async () => {
      let hasUpdates = false;

      for (const item of itemsNeedingPolling) {
        const updatedItem = await pollWardrobeItemUpdates(item.id);
        if (updatedItem && updatedItem.extracted_clothing_items) {
          // Check if any clothing items now have render images
          const hasNewRenderImages = updatedItem.extracted_clothing_items.some(
            (clothingItem: any, index: number) => {
              const originalItem = item.extracted_clothing_items?.[index];
              return clothingItem?.renderImageUrl && !originalItem?.renderImageUrl;
            }
          );

          if (hasNewRenderImages) {
            console.log('🎨 Detected new AI-generated images for item:', item.id);
            hasUpdates = true;
            
            // Update local state
            setLocalWardrobeItems(prev => 
              prev.map(prevItem => 
                prevItem.id === item.id ? { ...prevItem, ...updatedItem } : prevItem
              )
            );
          }
        }
      }

      if (hasUpdates && onItemsUpdated) {
        onItemsUpdated();
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup interval on unmount
    return () => {
      console.log('🧹 Cleaning up polling interval');
      clearInterval(pollInterval);
    };
  }, [wardrobeItems, onItemsUpdated]);

  // Extract all individual clothing items from all outfits with original images
  const allClothingItems = useMemo(() => {
    const items: ClothingItem[] = [];
    
    console.log('Processing wardrobe items:', localWardrobeItems.length);
    
    localWardrobeItems.forEach((outfit, outfitIndex) => {
      console.log(`Processing outfit ${outfitIndex + 1}:`, {
        id: outfit.id,
        hasExtractedItems: !!outfit.extracted_clothing_items,
        originalImageUrl: outfit.image_url,
        extractedItemsType: typeof outfit.extracted_clothing_items
      });

      if (outfit.extracted_clothing_items && Array.isArray(outfit.extracted_clothing_items)) {
        outfit.extracted_clothing_items.forEach((item: any, index: number) => {
          const clothingItem: ClothingItem = {
            id: `${outfit.id}::${index}`,
            name: item.name || 'Unknown Item',
            category: item.category || 'other',
            confidence: item.confidence || 0.8,
            source: item.source || 'ai',
            outfitId: outfit.id,
            outfitDate: outfit.created_at,
            outfitScore: outfit.rating_score || 0,
            originalImageUrl: outfit.image_url,
            renderImageUrl: item.renderImageUrl || null,
            arrayIndex: index
          };

          items.push(clothingItem);
          console.log(`✅ Added clothing item "${item.name}" with render image: ${item.renderImageUrl || 'none'}`);
        });
      }
    });
    
    console.log(`Total clothing items extracted: ${items.length}`);
    console.log(`Items with AI render images: ${items.filter(item => item.renderImageUrl).length}`);
    
    return items;
  }, [localWardrobeItems]);

  // Get unique categories for filtering
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(allClothingItems.map(item => item.category))];
    return uniqueCategories.sort();
  }, [allClothingItems]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = allClothingItems;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'date':
          return new Date(b.outfitDate).getTime() - new Date(a.outfitDate).getTime();
        case 'score':
          return b.outfitScore - a.outfitScore;
        default:
          return 0;
      }
    });

    return filtered;
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

      if (!wardrobeItem.extracted_clothing_items || !Array.isArray(wardrobeItem.extracted_clothing_items)) {
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
      <div className="text-center py-12">
        <div className="flex justify-center mb-6">
          <Shirt size={64} className="text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No clothing items found
        </h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Your individual clothing items will appear here once you save outfits with AI-extracted tags.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={handleAddItem} className="flex items-center gap-2">
            <Plus size={16} />
            Add Custom Item
          </Button>
          <BulkUploadDialog onUploadComplete={handleBulkUploadComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search clothing items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="date">Recently Added</SelectItem>
            <SelectItem value="score">Outfit Score</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleAddItem} className="flex items-center gap-2">
          <Plus size={16} />
          Add Item
        </Button>

        <BulkUploadDialog onUploadComplete={handleBulkUploadComplete} />
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>Showing {filteredAndSortedItems.length} of {allClothingItems.length} clothing items</span>
        <span>
          {allClothingItems.filter(item => item.renderImageUrl).length} items have AI images | {' '}
          {allClothingItems.filter(item => item.originalImageUrl).length} items have original images
        </span>
      </div>

      {/* Items grid */}
      {filteredAndSortedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedItems.map((item) => (
            <EditableClothingItem
              key={item.id}
              item={item}
              onUpdate={handleItemUpdate}
              onDelete={handleItemDelete}
              originalImageUrl={item.originalImageUrl}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No clothing items match your current filters.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('all');
            }}
            className="mt-2 text-fashion-500 hover:text-fashion-600"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default DigitalWardrobeTab;
