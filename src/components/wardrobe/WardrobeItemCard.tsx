
import React from 'react';
import { WardrobeItem } from '@/services/wardrobeService';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import WardrobeItemImage from './WardrobeItemImage';
import WardrobeItemDetails from './WardrobeItemDetails';
import WardrobeItemTags from './WardrobeItemTags';
import WardrobeItemActions from './WardrobeItemActions';

interface WardrobeItemCardProps {
  item: WardrobeItem;
  onDeleted: () => void;
}

const WardrobeItemCard: React.FC<WardrobeItemCardProps> = ({ item, onDeleted }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 bg-white">
      <WardrobeItemImage 
        imageUrl={item.image_url}
        score={item.rating_score || 0}
      />
      
      <CardContent className="p-6 space-y-4">
        {/* Clothing Items section moved to the top */}
        <WardrobeItemTags
          feedback={item.feedback}
          extractedClothingItems={item.extracted_clothing_items}
          itemId={item.id}
        />
        
        {/* Detailed Feedback and other details come after */}
        <WardrobeItemDetails
          createdAt={item.created_at}
          occasionContext={item.occasion_context}
          feedback={item.feedback}
        />
      </CardContent>
      
      <CardFooter className="p-6 pt-0 border-t border-gray-100">
        <WardrobeItemActions
          itemId={item.id}
          onDeleted={onDeleted}
        />
      </CardFooter>
    </Card>
  );
};

export default WardrobeItemCard;
