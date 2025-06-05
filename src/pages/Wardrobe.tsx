
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import WardrobeContent from '@/components/wardrobe/WardrobeContent';
import { Toaster } from '@/components/ui/sonner';

const Wardrobe: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-fashion-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-warm-cream">
      <WardrobeContent />
      <Toaster position="bottom-center" />
    </div>
  );
};

export default Wardrobe;
