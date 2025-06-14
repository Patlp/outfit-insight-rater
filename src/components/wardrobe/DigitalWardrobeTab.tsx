
import React from 'react';
import { WardrobeItem } from '@/services/wardrobe';
import WardrobeItemsManager from './WardrobeItemsManager';
import WardrobeLoadingState from './WardrobeLoadingState';
import WardrobeMainContent from './WardrobeMainContent';

interface DigitalWardrobeTabProps {
  wardrobeItems: WardrobeItem[];
  isLoading: boolean;
  onItemsUpdated?: () => void;
}

const DigitalWardrobeTab: React.FC<DigitalWardrobeTabProps> = ({ 
  wardrobeItems, 
  isLoading, 
  onItemsUpdated 
}) => {
  if (isLoading) {
    return <WardrobeLoadingState />;
  }

  return (
    <WardrobeItemsManager
      wardrobeItems={wardrobeItems}
      onItemsUpdated={onItemsUpdated}
    >
      {(managerProps) => (
        <WardrobeMainContent {...managerProps} />
      )}
    </WardrobeItemsManager>
  );
};

export default DigitalWardrobeTab;
