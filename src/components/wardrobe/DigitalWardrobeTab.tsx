
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { WardrobeItem } from '@/services/wardrobe';
import WardrobeItemsManager from './WardrobeItemsManager';
import WardrobeItemsGrid from './WardrobeItemsGrid';
import WardrobeControls from './WardrobeControls';
import WardrobeStats from './WardrobeStats';
import EmptyWardrobeState from './EmptyWardrobeState';
import BulkUploadDialog from './BulkUploadDialog';

interface DigitalWardrobeTabProps {
  wardrobeItems: WardrobeItem[];
  isLoading: boolean;
  onItemsUpdated: () => void;
}

const DigitalWardrobeTab: React.FC<DigitalWardrobeTabProps> = ({
  wardrobeItems,
  isLoading,
  onItemsUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'clothing' | 'inspirations'>('clothing');

  const handleNavigateToClothing = () => {
    setActiveTab('clothing');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <WardrobeItemsManager
      wardrobeItems={wardrobeItems}
      onItemsUpdated={onItemsUpdated}
    >
      {({
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
        handleBulkUploadComplete,
        handleClearFilters
      }) => (
        <div className="space-y-6">
          {/* Header with stats and upload button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <WardrobeStats 
              totalItems={allClothingItems.length}
              categories={categories.length}
              aiGenerateCount={0}
            />
            
            <BulkUploadDialog 
              onUploadComplete={handleBulkUploadComplete}
              onNavigateToClothing={handleNavigateToClothing}
            >
              <Button className="flex items-center gap-2">
                <Upload size={16} />
                Bulk Upload
              </Button>
            </BulkUploadDialog>
          </div>

          {allClothingItems.length === 0 ? (
            <EmptyWardrobeState />
          ) : (
            <>
              <WardrobeControls
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                sortBy={sortBy}
                onSortChange={setSortBy}
                filterCategory={filterCategory}
                onFilterChange={setFilterCategory}
                categories={categories}
                onClearFilters={handleClearFilters}
              />

              <WardrobeItemsGrid
                items={filteredAndSortedItems}
                onItemUpdate={handleItemUpdate}
                onItemDelete={handleItemDelete}
              />
            </>
          )}
        </div>
      )}
    </WardrobeItemsManager>
  );
};

export default DigitalWardrobeTab;
