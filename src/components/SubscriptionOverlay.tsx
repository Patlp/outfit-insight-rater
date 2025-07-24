import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Crown, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionOverlayProps {
  children: React.ReactNode;
}

const SubscriptionOverlay: React.FC<SubscriptionOverlayProps> = ({ children }) => {
  const { subscription } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If user is subscribed, show content normally
  if (subscription.subscribed) {
    return <>{children}</>;
  }

  const handleSubscribe = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { email }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start subscription process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none opacity-50">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-warm-cream/80 backdrop-blur-sm">
        <Card className="w-full max-w-md mx-4 shadow-lg border-2 border-fashion-200">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-fashion-600 to-fashion-800 rounded-full mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-fashion-900 mb-2">
                Unlock Premium Features
              </h3>
              <p className="text-fashion-600 text-sm leading-relaxed">
                Get personalized color analysis, curated color palettes, and body type styling recommendations
              </p>
            </div>

            <div className="mb-6 space-y-3">
              <div className="flex items-center text-sm text-fashion-700">
                <Sparkles className="h-4 w-4 mr-3 text-fashion-600" />
                Personalized Color Analysis
              </div>
              <div className="flex items-center text-sm text-fashion-700">
                <Sparkles className="h-4 w-4 mr-3 text-fashion-600" />
                Custom Color Palette Recommendations
              </div>
              <div className="flex items-center text-sm text-fashion-700">
                <Sparkles className="h-4 w-4 mr-3 text-fashion-600" />
                Body Type Styling Guidelines
              </div>
            </div>

            <div className="mb-6 p-4 bg-fashion-50 rounded-lg border border-fashion-200">
              <div className="text-2xl font-bold text-fashion-900">£5.00/month</div>
              <div className="text-sm text-fashion-600">Cancel anytime</div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-fashion-600 to-fashion-800 hover:from-fashion-700 hover:to-fashion-900 text-white font-medium py-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Get Premium Access - £5.00/month • Cancel anytime
                  </>
                )}
              </Button>

              <p className="text-xs text-fashion-500">
                After payment, you'll create your account and get instant access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionOverlay;