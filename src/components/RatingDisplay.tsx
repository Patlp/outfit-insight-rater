
import React, { useState } from 'react';
import { useRating } from '@/context/RatingContext';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ScoreDisplay from '@/components/rating/ScoreDisplay';
import FeedbackSection from '@/components/rating/FeedbackSection';
import SuggestionsSection from '@/components/rating/SuggestionsSection';
import RecommendationsSection from '@/components/rating/RecommendationsSection';
import EmailDialog from '@/components/rating/EmailDialog';

const RatingDisplay: React.FC = () => {
  const { ratingResult } = useRating();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  
  if (!ratingResult) return null;
  
  const { score, feedback, suggestions, recommendations } = ratingResult;
  
  return (
    <div className="animate-fade-in max-w-md w-full mx-auto mt-8 fashion-card">
      <ScoreDisplay score={score} />
      
      <FeedbackSection feedback={feedback} />
      
      <SuggestionsSection suggestions={suggestions} />
      
      <RecommendationsSection recommendations={recommendations} />
      
      <div className="mt-6 pt-6 border-t border-fashion-200">
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
