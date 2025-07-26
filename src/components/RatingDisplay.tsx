
import React, { useState } from 'react';
import { useRating } from '@/context/RatingContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Palette, User, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ScoreDisplay from '@/components/rating/ScoreDisplay';
import FeedbackSection from '@/components/rating/FeedbackSection';
import SuggestionsSection from '@/components/rating/SuggestionsSection';
// import RecommendationsSection from '@/components/rating/RecommendationsSection';
import EmailDialog from '@/components/rating/EmailDialog';
import StyleAnalysisSection from '@/components/style/StyleAnalysisSection';

const RatingDisplay: React.FC = () => {
  const { ratingResult } = useRating();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  
  if (!ratingResult) return null;
  
  const { score, feedback, suggestions, styleAnalysis /* , recommendations */ } = ratingResult;
  
  return (
    <div className="animate-fade-in max-w-md w-full mx-auto mt-8">
      <div className="fashion-card">
        <ScoreDisplay score={score} />
        
        <FeedbackSection feedback={feedback} />
        
        <SuggestionsSection suggestions={suggestions} />
        
        {/* <RecommendationsSection recommendations={recommendations} /> */}
        
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
      </div>
      
      {/* Show Style DNA for non-authenticated users, Dashboard redirect for authenticated users */}
      {user && styleAnalysis ? (
        <Card className="mt-8 bg-gradient-to-br from-fashion-50 to-warm-cream border-fashion-200">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-fashion-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-fashion-600" />
              </div>
              <h3 className="text-xl font-bold text-fashion-900 mb-2">
                Your Complete Style Analysis is Ready!
              </h3>
              <p className="text-fashion-600 mb-6">
                View your personalized Style DNA with detailed color analysis, body type insights, and curated color palette in your dashboard.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-fashion-100 rounded-lg flex items-center justify-center mx-auto">
                  <Palette className="h-5 w-5 text-fashion-600" />
                </div>
                <div>
                  <p className="font-medium text-fashion-900 text-sm">Color Analysis</p>
                  <p className="text-xs text-fashion-600">Seasonal color type</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="w-10 h-10 bg-fashion-100 rounded-lg flex items-center justify-center mx-auto">
                  <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-pink-400 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-fashion-900 text-sm">Color Palette</p>
                  <p className="text-xs text-fashion-600">Your best colors</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="w-10 h-10 bg-fashion-100 rounded-lg flex items-center justify-center mx-auto">
                  <User className="h-5 w-5 text-fashion-600" />
                </div>
                <div>
                  <p className="font-medium text-fashion-900 text-sm">Body Type</p>
                  <p className="text-xs text-fashion-600">Styling tips</p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-fashion-600 hover:bg-fashion-700 text-white flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : styleAnalysis ? (
        <StyleAnalysisSection styleAnalysis={styleAnalysis} />
      ) : null}

      <EmailDialog 
        isOpen={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        ratingResult={ratingResult}
      />
    </div>
  );
};

export default RatingDisplay;
