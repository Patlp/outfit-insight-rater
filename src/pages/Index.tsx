
import React from 'react';
import { RatingProvider } from '@/context/RatingContext';
import GenderToggle from '@/components/GenderToggle';
import UploadArea from '@/components/UploadArea';
import RatingDisplay from '@/components/RatingDisplay';
import PrivacyNotice from '@/components/PrivacyNotice';
import RoastModeToggle from '@/components/RoastModeToggle';
import InviteWall from '@/components/InviteWall';
import UserMenu from '@/components/UserMenu';
import { useRating } from '@/context/RatingContext';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';
import { performanceMonitor } from '@/utils/performanceMonitor';

const HomeContent: React.FC = () => {
  const { ratingResult } = useRating();
  
  // Initialize error recovery
  useErrorRecovery({
    onError: (error) => {
      console.error('Global error caught:', error);
      performanceMonitor.logMemoryUsage('error-recovery');
    }
  });
  
  React.useEffect(() => {
    performanceMonitor.logMemoryUsage('component-mount');
    console.log('HomeContent mounted successfully');
  }, []);
  
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center">
      <header className="text-center mb-8 relative">
        <div className="absolute top-4 right-4">
          <UserMenu />
        </div>
        <img 
          src="/lovable-uploads/3c887a45-fcd4-4fa5-8558-f2c9bbe856f9.png" 
          alt="RateMyFit Logo" 
          className="h-72 sm:h-80 md:h-96 mx-auto mb-4" 
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
    <ErrorBoundary>
      <RatingProvider>
        <div className="min-h-screen bg-warm-cream">
          <HomeContent />
          <Toaster position="bottom-center" />
        </div>
      </RatingProvider>
    </ErrorBoundary>
  );
};

export default Index;
