import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Crown, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ContentOverlayProps {
  children: React.ReactNode;
  className?: string;
}

const ContentOverlay: React.FC<ContentOverlayProps> = ({ children, className = '' }) => {
  const { user, subscription, createCheckoutSession, checkSubscription } = useAuth();
  const navigate = useNavigate();

  // If user is subscribed, show content normally
  if (subscription.subscribed) {
    return <>{children}</>;
  }

  const handleSubscribe = async () => {
    try {
      await createCheckoutSession();
    } catch (error) {
      toast.error('Failed to create checkout session');
    }
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleRefreshStatus = async () => {
    try {
      await checkSubscription();
      toast.success('Subscription status refreshed');
    } catch (error) {
      toast.error('Failed to refresh subscription status');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className="filter blur-sm opacity-60 pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-warm-cream/60 backdrop-blur-sm rounded-lg">
        <Card className="w-full max-w-sm mx-4 shadow-md border border-fashion-200/50">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-fashion-600 to-fashion-800 rounded-full mb-3">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-fashion-900 mb-1">
                Premium Content
              </h4>
              <p className="text-fashion-600 text-sm">
                Unlock detailed style insights
              </p>
            </div>

            <div className="mb-4 text-center">
              <div className="text-xl font-bold text-fashion-900">£5.00/month</div>
              <div className="text-xs text-fashion-600">Cancel anytime</div>
            </div>

            <div className="space-y-2">
              {user ? (
                <Button 
                  onClick={handleSubscribe}
                  size="sm"
                  className="w-full bg-gradient-to-r from-fashion-600 to-fashion-800 hover:from-fashion-700 hover:to-fashion-900 text-white font-medium"
                >
                  <Lock className="h-3 w-3 mr-2" />
                  Subscribe Now
                </Button>
              ) : (
                <Button 
                  onClick={handleSignIn}
                  size="sm"
                  className="w-full bg-gradient-to-r from-fashion-600 to-fashion-800 hover:from-fashion-700 hover:to-fashion-900 text-white font-medium"
                >
                  Sign In to Subscribe
                </Button>
              )}
              
              {user && (
                <Button 
                  onClick={handleRefreshStatus}
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={subscription.isChecking}
                >
                  <RefreshCw className={`h-3 w-3 mr-2 ${subscription.isChecking ? 'animate-spin' : ''}`} />
                  {subscription.isChecking ? 'Checking...' : 'Refresh Status'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentOverlay;