
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRating } from '@/context/RatingContext';
import { saveOutfitToWardrobe } from '@/services/wardrobeService';
import { toast } from 'sonner';
import AuthModal from '@/components/auth/AuthModal';

interface SaveOutfitButtonProps {
  imageUrl?: string;
}

const SaveOutfitButton: React.FC<SaveOutfitButtonProps> = ({ imageUrl }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ratingResult, selectedGender, occasionContext, feedbackMode, uploadedImage } = useRating();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Use uploadedImage from context if imageUrl prop is not provided
  const finalImageUrl = imageUrl || uploadedImage;

  const handleSaveOutfit = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!ratingResult || !finalImageUrl) {
      console.log('Missing data for save:', { ratingResult, finalImageUrl });
      toast.error('No outfit data to save');
      return;
    }

    setIsSaving(true);

    try {
      const result = await saveOutfitToWardrobe(
        user.id,
        finalImageUrl,
        ratingResult.score,
        ratingResult.feedback,
        ratingResult.suggestions,
        selectedGender,
        occasionContext?.eventContext,
        feedbackMode
      );

      if (result.error) {
        console.error('Error saving outfit:', result.error);
        toast.error('Failed to save outfit');
      } else {
        setIsSaved(true);
        toast.success('Outfit saved to your wardrobe!');
        // Redirect to wardrobe after a short delay
        setTimeout(() => {
          navigate('/wardrobe');
        }, 1500);
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
    // After successful authentication, attempt to save again
    // The data should still be available from localStorage via context
    setTimeout(() => {
      handleSaveOutfit();
    }, 500); // Small delay to ensure auth state is updated
  };

  const handleViewWardrobe = () => {
    navigate('/wardrobe');
  };

  if (!ratingResult) {
    return null;
  }

  return (
    <div className="space-y-3">
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

      {user && (
        <Button
          onClick={handleViewWardrobe}
          variant="ghost"
          className="w-full flex items-center justify-center gap-2 text-fashion-600 hover:text-fashion-700 hover:bg-fashion-50"
        >
          <Eye size={16} />
          View My Wardrobe
        </Button>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default SaveOutfitButton;
