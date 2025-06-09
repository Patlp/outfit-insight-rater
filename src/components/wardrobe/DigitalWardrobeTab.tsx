
import React, { useState, useMemo } from 'react';
import { WardrobeItem } from '@/services/wardrobeService';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Shirt } from 'lucide-react';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  confidence: number;
  source: string;
  outfitId: string;
  outfitDate: string;
  outfitScore: number;
}

interface DigitalWardrobeTabProps {
  wardrobeItems: WardrobeItem[];
  isLoading: boolean;
}

const DigitalWardrobeTab: React.FC<DigitalWardrobeTabProps> = ({ wardrobeItems, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Extract all individual clothing items from all outfits
  const allClothingItems = useMemo(() => {
    const items: ClothingItem[] = [];
    
    wardrobeItems.forEach(outfit => {
      if (outfit.extracted_clothing_items && Array.isArray(outfit.extracted_clothing_items)) {
        outfit.extracted_clothing_items.forEach((item: any, index: number) => {
          items.push({
            id: `${outfit.id}-${index}`,
            name: item.name || 'Unknown Item',
            category: item.category || 'other',
            confidence: item.confidence || 0.8,
            source: item.source || 'ai',
            outfitId: outfit.id,
            outfitDate: outfit.created_at,
            outfitScore: outfit.rating_score || 0
          });
        });
      }
    });
    
    return items;
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
        case 'confidence':
          return b.confidence - a.confidence;
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

  const getCategoryColor = (category: string) => {
    const colorMap = {
      tops: 'bg-blue-100 text-blue-700 border-blue-200',
      bottoms: 'bg-green-100 text-green-700 border-green-200',
      dresses: 'bg-purple-100 text-purple-700 border-purple-200',
      footwear: 'bg-orange-100 text-orange-700 border-orange-200',
      accessories: 'bg-pink-100 text-pink-700 border-pink-200',
      outerwear: 'bg-gray-100 text-gray-700 border-gray-200',
      other: 'bg-fashion-100 text-fashion-700 border-fashion-200'
    };
    return colorMap[category as keyof typeof colorMap] || colorMap.other;
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
        <p className="text-gray-500 max-w-md mx-auto">
          Your individual clothing items will appear here once you save outfits with AI-extracted tags.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <SelectItem value="confidence">Confidence</SelectItem>
            <SelectItem value="date">Recently Added</SelectItem>
            <SelectItem value="score">Outfit Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredAndSortedItems.length} of {allClothingItems.length} clothing items
      </div>

      {/* Items grid */}
      {filteredAndSortedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm leading-tight">
                  {item.name}
                </h3>
                <Badge
                  variant="secondary"
                  className={`text-xs ${getCategoryColor(item.category)} ml-2 flex-shrink-0`}
                >
                  {item.category}
                </Badge>
              </div>
              
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span>{Math.round(item.confidence * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>From outfit:</span>
                  <span className="font-medium">{item.outfitScore}/10</span>
                </div>
                <div className="flex justify-between">
                  <span>Added:</span>
                  <span>{new Date(item.outfitDate).toLocaleDateString()}</span>
                </div>
                {item.source === 'openai-vision' && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <span>AI Vision</span>
                  </div>
                )}
              </div>
            </div>
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
