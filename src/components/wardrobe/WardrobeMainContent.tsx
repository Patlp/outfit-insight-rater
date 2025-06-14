
import React from 'react';
import { ClothingItem } from './ClothingItemsProcessor';
import WardrobeControls from './WardrobeControls';
import WardrobeStats from './WardrobeStats';
import EmptyWardrobeState from './EmptyWardrobeState';
import WardrobeItemsGrid from './WardrobeItemsGrid';

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

export default WardrobeMainContent;
