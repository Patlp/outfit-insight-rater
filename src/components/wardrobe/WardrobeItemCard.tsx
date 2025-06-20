
import React from 'react';
import { WardrobeItem } from '@/services/wardrobe';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import WardrobeItemImage from './WardrobeItemImage';
import WardrobeItemDetails from './WardrobeItemDetails';
import WardrobeItemTags from './WardrobeItemTags';
import WardrobeItemActions from './WardrobeItemActions';
import ScoreDisplay from '@/components/rating/ScoreDisplay';
import FeedbackSection from '@/components/rating/FeedbackSection';
import SuggestionsSection from '@/components/rating/SuggestionsSection';

interface WardrobeItemCardProps {
  item: WardrobeItem;
  onDeleted: () => void;
}

const WardrobeItemCard: React.FC<WardrobeItemCardProps> = ({ item, onDeleted }) => {
  console.log('📝 WardrobeItemCard - Rendering item:', {
    id: item.id,
    imageUrl: item.image_url,
    originalImageUrl: item.original_image_url,
    rating: item.rating_score,
    feedback: item.feedback?.slice(0, 50) + '...',
    hasClothingItems: !!item.extracted_clothing_items
  });

  // Use original_image_url as fallback if image_url is not available
  const displayImageUrl = item.image_url || item.original_image_url;
  
  if (!displayImageUrl) {
    console.warn('⚠️ No image URL found for wardrobe item:', item.id);
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 bg-white">
      {/* Original Outfit Image */}
      <WardrobeItemImage 
        imageUrl={displayImageUrl || ''}
        score={item.rating_score || 0}
      />
      
      <CardContent className="p-6 space-y-4">
        {/* Rating and Analysis Section - Same as home screen */}
        {item.rating_score && item.rating_score > 0 && (
          <div className="space-y-4">
            <ScoreDisplay score={item.rating_score} />
            
            {item.feedback && (
              <FeedbackSection feedback={item.feedback} />
            )}
            
            {item.suggestions && item.suggestions.length > 0 && (
              <SuggestionsSection suggestions={item.suggestions} />
            )}
          </div>
        )}
        
        {/* Clothing Items section */}
        <WardrobeItemTags
          feedback={item.feedback}
          extractedClothingItems={item.extracted_clothing_items}
          itemId={item.id}
        />
        
        {/* Additional details */}
        <WardrobeItemDetails
          createdAt={item.created_at}
          occasionContext={item.occasion_context}
          feedback={null} // Don't duplicate feedback here since it's shown above
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
