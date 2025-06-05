
import React, { useState } from 'react';
import { useRating } from '@/context/RatingContext';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ScoreDisplay from '@/components/rating/ScoreDisplay';
import FeedbackSection from '@/components/rating/FeedbackSection';
import SuggestionsSection from '@/components/rating/SuggestionsSection';
import ProductRecommendationsSection from '@/components/rating/ProductRecommendationsSection';
import EmailDialog from '@/components/rating/EmailDialog';
import SaveOutfitButton from '@/components/rating/SaveOutfitButton';

const RatingDisplay: React.FC = () => {
  const { ratingResult, uploadedImage } = useRating();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  
  if (!ratingResult) return null;
  
  const { score, feedback, suggestions } = ratingResult;
  
  return (
    <div className="animate-fade-in max-w-md w-full mx-auto mt-8 fashion-card">
      <ScoreDisplay score={score} />
      
      <FeedbackSection feedback={feedback} />
      
      <SuggestionsSection suggestions={suggestions} />
      
      <ProductRecommendationsSection feedback={feedback} suggestions={suggestions} />
      
      <div className="mt-6 pt-6 border-t border-fashion-200 space-y-3">
        <SaveOutfitButton imageUrl={uploadedImage} />
        
        <p className="text-sm text-gray-500 italic mb-4">
          Remember, fashion is subjective and these suggestions are just guidelines!
        </p>
        
        <Button 
          onClick={() => setShowEmailDialog(true)} 
          className="w-full flex items-center justify-center gap-2 bg-fashion-500 hover:bg-fashion-600 text-white"
        >
          <Mail size={16} />
          Send My Results to Email
        </Button>
      </div>

      <EmailDialog 
        isOpen={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        ratingResult={ratingResult}
      />
    </div>
  );
};

export default RatingDisplay;
