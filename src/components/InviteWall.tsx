
import React, { useState } from 'react';
import { X, Send, LockOpen } from 'lucide-react';
import { useRating } from '@/context/RatingContext';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const InviteWall: React.FC = () => {
  const { showInviteWall, setShowInviteWall, setHasUnlockedRoastMode, setFeedbackMode } = useRating();
  const [emails, setEmails] = useState<string[]>(['', '', '']);
  const [isSending, setIsSending] = useState(false);
  
  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };
  
  const validateEmails = () => {
    // Filter out empty emails and check if we have at least one valid email
    const filledEmails = emails.filter(email => email.trim() !== '');
    if (filledEmails.length === 0) {
      toast({
        title: "Email Required",
        description: "Please enter at least one email to unlock Roast Mode",
        variant: "destructive"
      });
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = filledEmails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      toast({
        title: "Invalid Email",
        description: "Please enter valid email addresses",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  const sendInvites = async () => {
    if (!validateEmails()) return;
    
    setIsSending(true);
    
    try {
      // Filter out empty emails
      const validEmails = emails.filter(email => email.trim() !== '');
      
      // Show pending toast
      toast({
        title: "Sending invites...",
        description: `Inviting ${validEmails.length} friend${validEmails.length > 1 ? 's' : ''}`,
      });
      
      // Send the invites using Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-invites', {
        body: { emails: validEmails }
      });
      
      if (error) throw error;
      
      console.log('Invite response:', data);
      
      // Unlock Roast Mode
      setHasUnlockedRoastMode(true);
      setFeedbackMode('roast');
      
      // Close the invite wall
      setShowInviteWall(false);
      
      const sentCount = data?.sentEmails?.length || 0;
      const failedCount = data?.failedEmails?.length || 0;
      
      // Show success toast with sent/failed counts
      if (failedCount > 0) {
        toast({
          title: "Roast Mode Unlocked!",
          description: `Successfully sent ${sentCount} invite${sentCount !== 1 ? 's' : ''}, but ${failedCount} failed. Roast Mode is now active!`,
          variant: "default"
        });
      } else {
        toast({
          title: "Roast Mode Unlocked!",
          description: `Invites sent to ${sentCount} friend${sentCount !== 1 ? 's' : ''}. Roast Mode is now active!`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error sending invites:', error);
      toast({
        title: "Failed to send invites",
        description: "Please try again later or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const skipInvites = () => {
    // For demo purposes, allow skipping
    setHasUnlockedRoastMode(true);
    setFeedbackMode('roast');
    setShowInviteWall(false);
    
    toast({
      title: "Roast Mode Unlocked!",
      description: "You've unlocked Roast Mode without inviting friends (demo mode).",
    });
  };
  
  return (
    <Dialog open={showInviteWall} onOpenChange={setShowInviteWall}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <LockOpen className="h-5 w-5 text-orange-500" />
            Unlock Roast Mode
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Roast Mode is locked! Want brutal fashion truth? Invite friends to unlock it — they'll thank you later (or roast you back).
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="text-sm font-medium text-gray-700">
            We'll email them on your behalf with your permission. No spam, just a fun fit challenge.
          </div>
          
          <div className="space-y-3">
            {emails.map((email, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  type="email"
                  placeholder={`Friend's email ${index + 1}`}
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          
          <div className="flex justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowInviteWall(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <div className="space-x-2">
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                onClick={skipInvites}
                disabled={isSending}
              >
                Skip (Demo Only)
              </Button>
              <Button 
                type="button"
                onClick={sendInvites} 
                disabled={isSending}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send & Unlock'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteWall;
