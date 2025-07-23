import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface SubscriptionOverlayProps {
  children: React.ReactNode;
}

const SubscriptionOverlay: React.FC<SubscriptionOverlayProps> = ({ children }) => {
  const { user, subscription, createCheckoutSession } = useAuth();
  const navigate = useNavigate();

  // If user is subscribed, show content normally
  if (subscription.subscribed) {
    return <>{children}</>;
  }

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      navigate('/auth');
      return;
    }

    try {
      await createCheckoutSession();
    } catch (error) {
      toast.error('Failed to start subscription process. Please try again.');
    }
  };

  const handleSignIn = () => {
    navigate('/auth');
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
                Unlock Style Tips
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
              <div className="text-2xl font-bold text-fashion-900">$9.97/month</div>
              <div className="text-sm text-fashion-600">Cancel anytime</div>
            </div>

            {user ? (
              <Button 
                onClick={handleSubscribe}
                className="w-full bg-gradient-to-r from-fashion-600 to-fashion-800 hover:from-fashion-700 hover:to-fashion-900 text-white font-medium py-3"
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock Style Tips – Subscribe Now
              </Button>
            ) : (
              <div className="space-y-3">
                <Button 
                  onClick={handleSignIn}
                  className="w-full bg-gradient-to-r from-fashion-600 to-fashion-800 hover:from-fashion-700 hover:to-fashion-900 text-white font-medium py-3"
                >
                  Sign In to Subscribe
                </Button>
                <p className="text-xs text-fashion-500">
                  Need an account? Sign up to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionOverlay;