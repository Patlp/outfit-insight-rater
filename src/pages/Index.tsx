
import React from 'react';
import { RatingProvider } from '@/context/RatingContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shirt, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GenderToggle from '@/components/GenderToggle';
import UploadArea from '@/components/UploadArea';
import RatingDisplay from '@/components/RatingDisplay';
import PrivacyNotice from '@/components/PrivacyNotice';
import RoastModeToggle from '@/components/RoastModeToggle';
import InviteWall from '@/components/InviteWall';
import { useRating } from '@/context/RatingContext';
import { Toaster } from '@/components/ui/sonner';

const HomeContent: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { ratingResult } = useRating();

  const handleSignOut = async () => {
    await signOut();
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center">
      {user && (
        <div className="w-full flex justify-between items-center mb-6">
          <Button
            onClick={() => navigate('/wardrobe')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Shirt size={16} />
            My Wardrobe
          </Button>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <LogOut size={14} />
            Sign Out
          </Button>
        </div>
      )}
      
      <header className="text-center mb-8">
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
    <RatingProvider>
      <div className="min-h-screen bg-warm-cream">
        <HomeContent />
        <Toaster position="bottom-center" />
      </div>
    </RatingProvider>
  );
};

export default Index;
