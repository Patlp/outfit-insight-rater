
import React from 'react';
import { MessageSquare, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface ManualShareOptionsProps {
  onShareCompleted: () => void;
}

const ManualShareOptions: React.FC<ManualShareOptionsProps> = ({ onShareCompleted }) => {
  const defaultInviteText = "I just tried RateMyFit — an AI that critiques outfit photos! They have this 'Roast Mode' that's brutally honest. Check it out at ratemyfit.lovable.app";
  
  const shareViaWhatsApp = () => {
    const encodedText = encodeURIComponent(defaultInviteText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
    onShareCompleted();
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
    onShareCompleted();
  };

  const copyInviteText = () => {
    navigator.clipboard.writeText(defaultInviteText);
    toast({
      title: "Copied to clipboard!",
      description: "Invite text copied to clipboard",
    });
    onShareCompleted();
  };

  return (
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
  );
};

export default ManualShareOptions;
