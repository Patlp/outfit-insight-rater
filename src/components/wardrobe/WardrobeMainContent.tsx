
import React from 'react';
import { ClothingItem } from './ClothingItemsProcessor';
import WardrobeControls from './WardrobeControls';
import WardrobeItemsGrid from './WardrobeItemsGrid';
import WardrobeStats from './WardrobeStats';
import EmptyWardrobeState from './EmptyWardrobeState';

interface WardrobeMainContentProps {
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
}

const WardrobeMainContent: React.FC<WardrobeMainContentProps> = ({
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
}) => {
  console.log('🎨 WardrobeMainContent rendering with:', {
    totalItems: allClothingItems.length,
    filteredItems: filteredAndSortedItems.length,
    categories: categories.length,
    searchTerm,
    filterCategory,
    sortBy
  });

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <WardrobeStats 
        totalItems={allClothingItems.length}
        categories={categories.length - 1} // Subtract 'all' category
        aiGenerateCount={allClothingItems.filter(item => item.renderImageUrl).length}
      />

      {/* Controls */}
      <WardrobeControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterCategory={filterCategory}
        onFilterChange={setFilterCategory}
        categories={categories}
        onAddItem={handleAddItem}
        onBulkUploadComplete={handleBulkUploadComplete}
      />

      {/* Main Content */}
      {allClothingItems.length === 0 ? (
        <EmptyWardrobeState 
          onAddItem={handleAddItem}
          onBulkUploadComplete={handleBulkUploadComplete}
        />
      ) : filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No items match your current filters.</p>
          <button
            onClick={handleClearFilters}
            className="text-fashion-500 hover:text-fashion-600 font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <WardrobeItemsGrid
          items={filteredAndSortedItems}
          onUpdate={handleItemUpdate}
          onDelete={handleItemDelete}
          onClearFilters={handleClearFilters}
        />
      )}
    </div>
  );
};

export default WardrobeMainContent;
