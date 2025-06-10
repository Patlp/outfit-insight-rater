
import React, { useState, useMemo } from 'react';
import { WardrobeItem } from '@/services/wardrobeService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Shirt, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditableClothingItem from './EditableClothingItem';
import BulkUploadDialog from './BulkUploadDialog';
import { toast } from 'sonner';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  confidence: number;
  source: string;
  outfitId: string;
  outfitDate: string;
  outfitScore: number;
  croppedImageUrl?: string;
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

  // Extract all individual clothing items from all outfits with cropped images
  const [allClothingItems, setAllClothingItems] = useState<ClothingItem[]>(() => {
    const items: ClothingItem[] = [];
    
    wardrobeItems.forEach(outfit => {
      if (outfit.extracted_clothing_items && Array.isArray(outfit.extracted_clothing_items)) {
        outfit.extracted_clothing_items.forEach((item: any, index: number) => {
          // Find corresponding cropped image
          let croppedImageUrl: string | undefined;
          
          if (outfit.cropped_images && Array.isArray(outfit.cropped_images)) {
            const croppedItem = outfit.cropped_images.find((cropped: any) => 
              cropped.item_name?.toLowerCase() === item.name?.toLowerCase()
            );
            croppedImageUrl = croppedItem?.cropped_image_url;
          }

          items.push({
            id: `${outfit.id}-${index}`,
            name: item.name || 'Unknown Item',
            category: item.category || 'other',
            confidence: item.confidence || 0.8,
            source: item.source || 'ai',
            outfitId: outfit.id,
            outfitDate: outfit.created_at,
            outfitScore: outfit.rating_score || 0,
            croppedImageUrl
          });
        });
      }
    });
    
    return items;
  });

  // Update items when wardrobeItems change
  React.useEffect(() => {
    const items: ClothingItem[] = [];
    
    wardrobeItems.forEach(outfit => {
      if (outfit.extracted_clothing_items && Array.isArray(outfit.extracted_clothing_items)) {
        outfit.extracted_clothing_items.forEach((item: any, index: number) => {
          // Find corresponding cropped image
          let croppedImageUrl: string | undefined;
          
          if (outfit.cropped_images && Array.isArray(outfit.cropped_images)) {
            const croppedItem = outfit.cropped_images.find((cropped: any) => 
              cropped.item_name?.toLowerCase() === item.name?.toLowerCase()
            );
            croppedImageUrl = croppedItem?.cropped_image_url;
          }

          items.push({
            id: `${outfit.id}-${index}`,
            name: item.name || 'Unknown Item',
            category: item.category || 'other',
            confidence: item.confidence || 0.8,
            source: item.source || 'ai',
            outfitId: outfit.id,
            outfitDate: outfit.created_at,
            outfitScore: outfit.rating_score || 0,
            croppedImageUrl
          });
        });
      }
    });
    
    setAllClothingItems(items);
  }, [wardrobeItems]);

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
    setAllClothingItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, ...updates }
        : item
    ));
    toast.success('Item updated successfully');
  };

  const handleItemDelete = (itemId: string) => {
    setAllClothingItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item deleted from wardrobe');
  };

  const handleAddItem = () => {
    const newItem: ClothingItem = {
      id: `custom-${Date.now()}`,
      name: 'New Item',
      category: 'other',
      confidence: 1.0,
      source: 'manual',
      outfitId: '',
      outfitDate: new Date().toISOString(),
      outfitScore: 0
    };
    setAllClothingItems(prev => [newItem, ...prev]);
    toast.success('New item added to wardrobe');
  };

  const handleBulkUploadComplete = () => {
    toast.success('Bulk upload completed! Refreshing wardrobe...');
    if (onItemsUpdated) {
      onItemsUpdated();
    }
  };

  // Debug logging
  React.useEffect(() => {
    console.log('DigitalWardrobeTab: wardrobeItems count:', wardrobeItems.length);
    console.log('DigitalWardrobeTab: allClothingItems count:', allClothingItems.length);
    console.log('DigitalWardrobeTab: sample item with cropped image:', 
      allClothingItems.find(item => item.croppedImageUrl)
    );
  }, [wardrobeItems, allClothingItems]);

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
        <span>{allClothingItems.filter(item => item.croppedImageUrl).length} items have images</span>
      </div>

      {/* Items grid */}
      {filteredAndSortedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedItems.map((item) => (
            <ClothingItemCard
              key={item.id}
              item={item}
              onUpdate={handleItemUpdate}
              onDelete={handleItemDelete}
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

// Separate ClothingItemCard component for better organization
const ClothingItemCard: React.FC<{
  item: ClothingItem;
  onUpdate: (itemId: string, updates: Partial<ClothingItem>) => void;
  onDelete: (itemId: string) => void;
}> = ({ item, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [editedCategory, setEditedCategory] = useState(item.category);

  const handleSave = () => {
    if (editedName.trim().length < 2) {
      toast.error('Item name must be at least 2 characters');
      return;
    }

    onUpdate(item.id, {
      name: editedName.trim(),
      category: editedCategory
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(item.name);
    setEditedCategory(item.category);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {item.croppedImageUrl ? (
          <img
            src={item.croppedImageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Failed to load cropped image:', item.croppedImageUrl);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.classList.remove('hidden');
              }
            }}
          />
        ) : null}
        
        {/* Fallback placeholder */}
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-200 ${item.croppedImageUrl ? 'hidden' : ''}`}>
          <Shirt size={32} className="text-gray-400" />
        </div>

        {/* Source badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 text-xs rounded ${
            item.source === 'ai' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {item.source === 'ai' ? 'AI Vision' : 'Manual'}
          </span>
        </div>

        {/* Confidence score for AI items */}
        {item.source === 'ai' && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs bg-white/90 text-gray-700 rounded border">
              {Math.round(item.confidence * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Item name"
              className="font-medium"
            />
            
            <Select value={editedCategory} onValueChange={setEditedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tops">Tops</SelectItem>
                <SelectItem value="bottoms">Bottoms</SelectItem>
                <SelectItem value="dresses">Dresses</SelectItem>
                <SelectItem value="outerwear">Outerwear</SelectItem>
                <SelectItem value="footwear">Footwear</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="flex-1">
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-gray-900 line-clamp-2">{item.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{item.category}</p>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>From outfit: {formatDate(item.outfitDate)}</p>
              {item.outfitScore > 0 && (
                <p>Outfit score: {item.outfitScore}/10</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setIsEditing(true)} 
                variant="outline" 
                size="sm" 
                className="flex-1"
              >
                Edit
              </Button>
              <Button 
                onClick={handleDelete} 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalWardrobeTab;
