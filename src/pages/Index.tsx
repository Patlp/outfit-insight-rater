
import React from 'react';
import { RatingProvider } from '@/context/RatingContext';
import GenderToggle from '@/components/GenderToggle';
import UploadArea from '@/components/UploadArea';
import RatingDisplay from '@/components/RatingDisplay';
import PrivacyNotice from '@/components/PrivacyNotice';
import { useRating } from '@/context/RatingContext';

const HomeContent: React.FC = () => {
  const { ratingResult } = useRating();
  
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 fashion-gradient bg-clip-text text-transparent">
          RateMyFit
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Upload your outfit photo and get instant AI-powered style feedback and improvement suggestions
        </p>
      </header>
      
      <GenderToggle />
      
      <UploadArea />
      
      {ratingResult && <RatingDisplay />}
      
      <PrivacyNotice />
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <RatingProvider>
      <div className="min-h-screen bg-gradient-to-b from-fashion-100 to-white">
        <HomeContent />
      </div>
    </RatingProvider>
  );
};

export default Index;
