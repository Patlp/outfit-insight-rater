
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
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <WardrobeItemImage 
        imageUrl={item.image_url}
        score={item.rating_score || 0}
      />
      
      <CardContent className="p-4">
        <WardrobeItemDetails
          createdAt={item.created_at}
          occasionContext={item.occasion_context}
          feedback={item.feedback}
        />
        
        <WardrobeItemTags
          feedback={item.feedback}
          extractedClothingItems={item.extracted_clothing_items}
          itemId={item.id}
        />
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <WardrobeItemActions
          itemId={item.id}
          onDeleted={onDeleted}
        />
      </CardFooter>
    </Card>
  );
};

export default WardrobeItemCard;
