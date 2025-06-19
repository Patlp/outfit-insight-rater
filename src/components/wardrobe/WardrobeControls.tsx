
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Plus, Upload } from 'lucide-react';
import BulkUploadDialog from './BulkUploadDialog';

interface WardrobeControlsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  filterCategory: string;
  onFilterChange: (category: string) => void;
  categories: string[];
  onClearFilters: () => void;
}

const WardrobeControls: React.FC<WardrobeControlsProps> = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  filterCategory,
  onFilterChange,
  categories,
  onClearFilters
}) => {
  const handleAddItem = () => {
    // For now, we'll just show a message about using the bulk upload
    console.log('Add item functionality not implemented yet');
  };

  const handleBulkUploadComplete = () => {
    console.log('Bulk upload completed');
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search clothing items..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <Select value={filterCategory} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Newest First</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleAddItem} variant="outline" size="sm">
          <Plus size={16} className="mr-1" />
          Add Item
        </Button>
        
        <BulkUploadDialog onUploadComplete={handleBulkUploadComplete}>
          <Button variant="outline" size="sm">
            <Upload size={16} className="mr-1" />
            Bulk Upload
          </Button>
        </BulkUploadDialog>

        {(searchTerm || filterCategory !== 'all') && (
          <Button onClick={onClearFilters} variant="outline" size="sm">
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default WardrobeControls;
