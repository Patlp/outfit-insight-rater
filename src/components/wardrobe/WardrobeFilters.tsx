
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WardrobeFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

const WardrobeFilters: React.FC<WardrobeFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedFilter,
  onFilterChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          placeholder="Search by clothing items, colors, styles..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex items-center gap-2 md:w-48">
        <Filter size={20} className="text-gray-500" />
        <Select value={selectedFilter} onValueChange={onFilterChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="high">High (8-10)</SelectItem>
            <SelectItem value="medium">Medium (6-7)</SelectItem>
            <SelectItem value="low">Low (1-5)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default WardrobeFilters;
