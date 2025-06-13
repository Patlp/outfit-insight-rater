
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BulkUploadDialog from './BulkUploadDialog';

interface WardrobeControlsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterCategory: string;
  onFilterChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  categories: string[];
  onAddItem: () => void;
  onBulkUploadComplete: () => void;
}

const WardrobeControls: React.FC<WardrobeControlsProps> = ({
  searchTerm,
  onSearchChange,
  filterCategory,
  onFilterChange,
  sortBy,
  onSortChange,
  categories,
  onAddItem,
  onBulkUploadComplete
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          placeholder="Search clothing items..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={filterCategory} onValueChange={onFilterChange}>
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
      
      <Select value={sortBy} onValueChange={onSortChange}>
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

      <Button onClick={onAddItem} className="flex items-center gap-2">
        <Plus size={16} />
        Add Item
      </Button>

      <BulkUploadDialog onUploadComplete={onBulkUploadComplete} />
    </div>
  );
};

export default WardrobeControls;
