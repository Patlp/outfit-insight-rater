
import React from 'react';
import { Card } from '@/components/ui/card';
import { Shirt } from 'lucide-react';

interface WardrobeStatsProps {
  totalItems: number;
  categories: number;
  aiGenerateCount: number;
}

const WardrobeStats: React.FC<WardrobeStatsProps> = ({
  totalItems
}) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shirt size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WardrobeStats;
