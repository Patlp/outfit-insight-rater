
import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { RatingResult } from '@/context/RatingContext';

interface EmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ratingResult: RatingResult;
}

const EmailDialog: React.FC<EmailDialogProps> = ({ isOpen, onClose, ratingResult }) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { score, feedback, suggestions } = ratingResult;

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    
    try {
      // Prepare the data to send
      const emailData = {
        email,
        subject: `Your Fashion Rating: ${score}/10`,
        score,
        feedback,
        suggestions
      };
      
      const { data, error } = await fetch('https://frfvrgarcwmpviimsenu.supabase.co/functions/v1/send-rating-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      }).then(res => res.json());
      
      if (error) {
        throw new Error(error.message || 'Failed to send email');
      }
      
      toast.success('Rating results sent to your email!');
      onClose();
      setEmail('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-fashion-500" />
            Send Your Results
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Enter your email address to receive your style rating and personalized suggestions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground italic mt-1">
              (If you don't see the email shortly, please check your spam or junk folder)
            </p>
          </div>
          
          <div className="flex gap-3 justify-end">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleSendEmail} 
              disabled={isSending}
              className="bg-fashion-500 hover:bg-fashion-600 text-white"
            >
              {isSending ? 'Sending...' : (
                <>
                  <Send size={16} className="mr-2" />
                  Send Results
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailDialog;
