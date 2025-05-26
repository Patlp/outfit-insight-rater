import React from 'react';
import { RatingProvider } from '@/context/RatingContext';
import GenderToggle from '@/components/GenderToggle';
import UploadArea from '@/components/UploadArea';
import RatingDisplay from '@/components/RatingDisplay';
import PrivacyNotice from '@/components/PrivacyNotice';
import InviteWall from '@/components/InviteWall';
import { useRating } from '@/context/RatingContext';
import { Toaster } from '@/components/ui/sonner';

const HomeContent: React.FC = () => {
  const { ratingResult } = useRating();
  
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center">
      <header className="text-center mb-8">
        <div className="flex items-center justify-center mb-3">
          <img 
            src="/lovable-uploads/517422e1-0903-4a86-a7c0-a2c7ff150996.png" 
            alt="RateMyFit Logo" 
            className="h-16 mr-3" 
          />
          <h1 className="text-3xl md:text-4xl font-bold text-black" style={{ 
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif", 
            letterSpacing: '-0.02em',
            fontWeight: 800
          }}>
            RateMyFit
          </h1>
        </div>
        <p className="text-gray-600 max-w-md mx-auto">
          Upload your outfit photo and get instant AI-powered style feedback and improvement suggestions
        </p>
      </header>
      
      <GenderToggle />
      <InviteWall />
      
      <UploadArea />
      
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
