
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shirt, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WardrobeEmptyState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <Shirt size={64} className="text-gray-300" />
          <Camera size={24} className="absolute -bottom-2 -right-2 text-gray-400" />
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        Your wardrobe is empty
      </h3>
      
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Start building your style collection by rating your outfits. 
        Each rating you save will appear here for future reference.
      </p>
      
      <Button
        onClick={() => navigate('/')}
        className="bg-fashion-500 hover:bg-fashion-600 text-white"
      >
        <Camera size={16} className="mr-2" />
        Rate Your First Outfit
      </Button>
    </div>
  );
};

export default WardrobeEmptyState;
