
import React from 'react';
import { Card } from '@/components/ui/card';
import { Shirt, Folder, Sparkles, Target } from 'lucide-react';

interface WardrobeStatsProps {
  totalItems: number;
  categories: number;
  aiGenerateCount: number;
}

const WardrobeStats: React.FC<WardrobeStatsProps> = ({
  totalItems,
  categories,
  aiGenerateCount
}) => {
  const aiGenerationRate = totalItems > 0 ? Math.round((aiGenerateCount / totalItems) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Folder size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Categories</p>
            <p className="text-2xl font-bold text-gray-900">{categories}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Target size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">AI Enhanced</p>
            <p className="text-2xl font-bold text-gray-900">
              {aiGenerateCount}
              <span className="text-sm font-normal text-gray-500 ml-1">
                ({aiGenerationRate}%)
              </span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WardrobeStats;
