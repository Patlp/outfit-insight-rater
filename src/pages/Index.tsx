
import React from 'react';
import { RatingProvider } from '@/context/RatingContext';
import GenderToggle from '@/components/GenderToggle';
import UploadArea from '@/components/UploadArea';
import RatingDisplay from '@/components/RatingDisplay';
import PrivacyNotice from '@/components/PrivacyNotice';
import RoastModeToggle from '@/components/RoastModeToggle';
import InviteWall from '@/components/InviteWall';
import { useRating } from '@/context/RatingContext';
import { Toaster } from '@/components/ui/sonner';

const HomeContent: React.FC = () => {
  const { ratingResult } = useRating();
  
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center">
      <header className="text-center mb-8">
        <img 
          src="/lovable-uploads/3c887a45-fcd4-4fa5-8558-f2c9bbe856f9.png" 
          alt="RateMyFit Logo" 
          className="h-30 mx-auto mb-3" 
        />
        <p className="text-gray-600 max-w-md mx-auto">
          Upload your outfit photo and get instant AI-powered style feedback and improvement suggestions
        </p>
      </header>
      
      <GenderToggle />
      <InviteWall />
      
      <div className="mb-8">
        <UploadArea />
      </div>
      
      <RoastModeToggle />
      
      {ratingResult && <RatingDisplay />}
      
      <PrivacyNotice />
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <RatingProvider>
      <div className="min-h-screen bg-warm-cream">
        <HomeContent />
        <Toaster position="bottom-center" />
      </div>
    </RatingProvider>
  );
};

export default Index;
