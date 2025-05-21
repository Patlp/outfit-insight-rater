
import React, { useState } from 'react';
import { X, Send, LockOpen, Copy, MessageSquare, AlertCircle } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const InviteWall: React.FC = () => {
  const { showInviteWall, setShowInviteWall, setHasUnlockedRoastMode, setFeedbackMode, feedbackMode } = useRating();
  const [emails, setEmails] = useState<string[]>(['', '', '']);
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const defaultInviteText = "I just tried RateMyFit — an AI that critiques outfit photos! They have this 'Roast Mode' that's brutally honest. Check it out at ratemyfit.lovable.app";
  
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
          description: `Successfully sent ${sentCount} invite${sentCount !== 1 ? 's' : ''}, but ${failedCount} failed. Roast Mode is now active for you!`,
          variant: "default"
        });
      } else {
        toast({
          title: "Roast Mode Unlocked!",
          description: `Invites sent to ${sentCount} friend${sentCount !== 1 ? 's' : ''}. Roast Mode is now active for you!`,
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

  const shareViaWhatsApp = () => {
    const encodedText = encodeURIComponent(defaultInviteText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
    setShowConfirmation(true);
  };

  const shareViaMessageSquare = () => {
    // For iOS/macOS, try to use SMS URL scheme
    const smsUrl = `sms:&body=${encodeURIComponent(defaultInviteText)}`;
    
    // If on mobile, attempt to open native SMS app
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      window.location.href = smsUrl;
    } else {
      // On desktop, just copy to clipboard
      copyInviteText();
      toast({
        title: "Message copied!",
        description: "Paste this in your messaging app to invite friends",
      });
    }
    setShowConfirmation(true);
  };

  const copyInviteText = () => {
    navigator.clipboard.writeText(defaultInviteText);
    toast({
      title: "Copied to clipboard!",
      description: "Invite text copied to clipboard",
    });
    setShowConfirmation(true);
  };

  const confirmManualInvite = () => {
    // Unlock Roast Mode
    setHasUnlockedRoastMode(true);
    setFeedbackMode('roast');
    setShowInviteWall(false);
    setShowConfirmation(false);

    toast({
      title: "Roast Mode Unlocked!",
      description: "Thanks for spreading the word. Roast Mode is now active for YOU!",
    });
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
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium">What is Roast Mode?</p>
                  <p className="mt-1">It's a special feedback mode that gives you brutally honest, no-holds-barred critique of your outfits. Perfect when you want the unfiltered truth about your style.</p>
                </div>
              </div>
              
              <div className="text-sm font-medium text-gray-700">
                Enter friends' emails to invite them to try RateMyFit. We'll email them with your permission, and you'll unlock Roast Mode for yourself! (No spam, just a fun invitation)
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
                <Button 
                  type="button"
                  onClick={sendInvites} 
                  disabled={isSending}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? 'Sending...' : 'Send & Unlock for Me'}
                </Button>
              </div>

              <Separator className="my-4" />
              
              <div className="space-y-4">
                <p className="text-sm font-medium text-center">
                  Prefer to invite manually? Use one of the options below to share with friends and unlock Roast Mode for yourself!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button 
                    variant="outline"
                    onClick={shareViaWhatsApp}
                    className="flex-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    <span className="ml-2">WhatsApp</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={shareViaMessageSquare}
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="ml-2">iMessage/SMS</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={copyInviteText}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="ml-2">Copy Text</span>
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
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
                onClick={confirmManualInvite}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                Yes, I invited friends
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmation(false)}
                className="w-full"
              >
                Not yet
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteWall;
