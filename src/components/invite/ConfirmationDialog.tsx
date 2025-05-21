
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ConfirmationDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="space-y-6 py-4">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-center">
          Did you invite your friends to RateMyFit?
        </DialogTitle>
        <DialogDescription className="text-base text-center pt-2">
          Confirming this will unlock Roast Mode for YOUR outfit feedback
        </DialogDescription>
      </DialogHeader>
      
      <div className="flex flex-col items-center gap-4">
        <Button 
          onClick={onConfirm}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          Yes, I invited friends
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="w-full"
        >
          Not yet
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
