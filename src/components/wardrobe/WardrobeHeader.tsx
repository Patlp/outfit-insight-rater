
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shirt, Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface WardrobeHeaderProps {
  itemCount: number;
  isLoading: boolean;
}

const WardrobeHeader: React.FC<WardrobeHeaderProps> = ({ itemCount, isLoading }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  console.log('🗂️ WardrobeHeader rendered with itemCount:', itemCount);

  const handleSignOut = async () => {
    console.log('🚪 Sign out initiated from wardrobe');
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleBackToHome = () => {
    console.log('🏠 Navigating back to home');
    navigate('/');
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={handleBackToHome}
          className="flex items-center gap-2"
        >
          <Home size={20} />
          Back to Home
        </Button>
        <div className="flex items-center gap-3">
          <Shirt className="text-fashion-500" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-fashion-600">My Wardrobe</h1>
            <p className="text-gray-600">
              {isLoading ? 'Loading...' : `${itemCount} outfit${itemCount !== 1 ? 's' : ''} saved`}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default WardrobeHeader;
