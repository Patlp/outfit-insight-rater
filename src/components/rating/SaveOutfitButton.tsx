
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRating } from '@/context/RatingContext';
import { saveOutfitToWardrobe } from '@/services/wardrobeService';
import { toast } from 'sonner';
import AuthModal from '@/components/auth/AuthModal';

interface SaveOutfitButtonProps {
  imageUrl?: string;
}

const SaveOutfitButton: React.FC<SaveOutfitButtonProps> = ({ imageUrl }) => {
  const { user } = useAuth();
  const { ratingResult, selectedGender, occasionContext, isRoastMode } = useRating();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSaveOutfit = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!ratingResult || !imageUrl) {
      toast.error('No outfit data to save');
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await saveOutfitToWardrobe(
        imageUrl,
        ratingResult,
        selectedGender,
        occasionContext?.eventContext,
        isRoastMode ? 'roast' : 'normal'
      );

      if (error) {
        console.error('Error saving outfit:', error);
        toast.error('Failed to save outfit');
      } else {
        setIsSaved(true);
        toast.success('Outfit saved to your wardrobe!');
      }
    } catch (error) {
      console.error('Error saving outfit:', error);
      toast.error('Failed to save outfit');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Try to save again after successful authentication
    setTimeout(() => {
      handleSaveOutfit();
    }, 100);
  };

  if (!ratingResult) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleSaveOutfit}
        disabled={isSaving || isSaved}
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
      >
        {isSaved ? (
          <>
            <BookmarkCheck size={16} className="text-green-600" />
            Saved to Wardrobe
          </>
        ) : (
          <>
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
            ) : (
              <Bookmark size={16} />
            )}
            {isSaving ? 'Saving...' : 'Save to Wardrobe'}
          </>
        )}
      </Button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default SaveOutfitButton;
