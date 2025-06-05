
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WardrobeHeaderProps {
  itemCount: number;
  isLoading: boolean;
}

const WardrobeHeader: React.FC<WardrobeHeaderProps> = ({ itemCount, isLoading }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Button>
        <div className="flex items-center gap-3">
          <Shirt className="text-fashion-500" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-fashion-600">My Wardrobe</h1>
            <p className="text-gray-600">
              {isLoading ? 'Loading...' : `${itemCount} outfit${itemCount !== 1 ? 's' : ''} saved`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WardrobeHeader;
