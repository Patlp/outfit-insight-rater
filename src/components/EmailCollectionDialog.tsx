import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

interface EmailCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailSubmit: (email: string) => Promise<void>;
  loading?: boolean;
}

const EmailCollectionDialog: React.FC<EmailCollectionDialogProps> = ({
  open,
  onOpenChange,
  onEmailSubmit,
  loading = false
}) => {
  const [email, setEmail] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsValidating(true);
    try {
      await onEmailSubmit(email);
      // Store email for later use in signup
      sessionStorage.setItem('payment_email', email);
    } catch (error) {
      console.error('Email submission error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading && !isValidating) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setEmail('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enter Your Email
          </DialogTitle>
          <DialogDescription>
            We'll need your email address to create your account and manage your subscription.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || isValidating}
              required
              autoFocus
            />
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading || isValidating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || isValidating || !email.trim()}
              className="min-w-[120px]"
            >
              {loading || isValidating ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </div>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmailCollectionDialog;