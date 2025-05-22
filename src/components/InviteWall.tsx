
import React, { useState } from 'react';
import { LockOpen, X } from 'lucide-react';
import { useRating } from '@/context/RatingContext';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Import our component files
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

    toast.success("Roast Mode Unlocked! Ready for brutally honest feedback.");
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

  const handleClose = () => {
    if (showConfirmation) {
      setShowConfirmation(false);
    } else {
      setShowInviteWall(false);
    }
  };
  
  return (
    <Dialog open={showInviteWall} onOpenChange={setShowInviteWall}>
      <DialogContent className="fixed-center sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogClose>

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

              <div className="mt-4 text-center">
                <Button 
                  variant="ghost" 
                  onClick={handleClose}
                  className="text-gray-500"
                >
                  Maybe Later
                </Button>
              </div>
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
