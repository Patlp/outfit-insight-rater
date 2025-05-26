
import { RatingProvider, useRating } from '@/context/RatingContext';
import GenderToggle from '@/components/GenderToggle';
import RoastModeToggle from '@/components/RoastModeToggle';
import UploadArea from '@/components/UploadArea';
import RatingDisplay from '@/components/RatingDisplay';
import InviteWall from '@/components/InviteWall';
import PrivacyNotice from '@/components/PrivacyNotice';
import OccasionContextInput from '@/components/upload/OccasionContextInput';

const AppContent = () => {
  const { 
    currentStep, 
    setCurrentStep, 
    setOccasionContext, 
    ratingResult, 
    showInviteWall 
  } = useRating();

  const handleOccasionNext = (occasionData: { eventContext: string | null; isNeutral: boolean }) => {
    setOccasionContext(occasionData);
    setCurrentStep('upload');
  };

  const handleBackToOccasion = () => {
    setCurrentStep('occasion');
  };

  if (showInviteWall) {
    return <InviteWall />;
  }

  if (ratingResult) {
    return <RatingDisplay />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            RateMyFit
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get instant AI-powered fashion feedback and style suggestions
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {currentStep === 'occasion' && (
            <OccasionContextInput onNext={handleOccasionNext} />
          )}
          
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <button
                  onClick={handleBackToOccasion}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                >
                  ← Back to occasion details
                </button>
              </div>
              
              <div className="flex justify-center gap-4 mb-6">
                <GenderToggle />
                <RoastModeToggle />
              </div>
              
              <UploadArea />
            </div>
          )}
        </div>

        <PrivacyNotice />
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <RatingProvider>
      <AppContent />
    </RatingProvider>
  );
};

export default Index;
