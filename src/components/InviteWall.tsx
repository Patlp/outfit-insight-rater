
import React, { useState } from 'react';
import { LockOpen } from 'lucide-react';
import { useRating } from '@/context/RatingContext';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

// Import our new component files
import EmailInviteForm from './invite/EmailInviteForm';
import ManualShareOptions from './invite/ManualShareOptions';
import ConfirmationDialog from './invite/ConfirmationDialog';
import RoastModeExplanation from './invite/RoastModeExplanation';

const InviteWall: React.FC = () => {
  const { showInviteWall, setShowInviteWall, setHasUnlockedRoastMode, setFeedbackMode } = useRating();
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const unlockRoastMode = () => {
    setHasUnlockedRoastMode(true);
    setFeedbackMode('roast');
    setShowInviteWall(false);

    toast({
      title: "Roast Mode Unlocked!",
      description: "Thanks for spreading the word. Roast Mode is now active for YOU!",
    });
  };

  const handleManualShareCompleted = () => {
    setShowConfirmation(true);
  };
  
  const handleConfirmManualInvite = () => {
    unlockRoastMode();
    setShowConfirmation(false);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };
  
  return (
    <Dialog open={showInviteWall} onOpenChange={setShowInviteWall}>
      <DialogContent className="sm:max-w-md">
        {!showConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <LockOpen className="h-5 w-5 text-orange-500" />
                Unlock Roast Mode — For You
              </DialogTitle>
              <DialogDescription className="text-base pt-2">
                <span className="font-medium text-orange-600">Want brutally honest fashion feedback for YOUR outfits?</span> Invite friends to try RateMyFit and unlock "Roast Mode" for yourself!
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <RoastModeExplanation />
              
              <div className="text-sm font-medium text-gray-700">
                Enter friends' emails to invite them to try RateMyFit. We'll email them with your permission, and you'll unlock Roast Mode for yourself! (No spam, just a fun invitation)
              </div>
              
              <EmailInviteForm onSuccess={unlockRoastMode} />
              
              <Separator className="my-4" />
              
              <ManualShareOptions onShareCompleted={handleManualShareCompleted} />
            </div>
          </>
        ) : (
          <ConfirmationDialog 
            onConfirm={handleConfirmManualInvite}
            onCancel={handleCancelConfirmation}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteWall;
