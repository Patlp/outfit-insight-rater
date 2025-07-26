import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Crown, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import EmailCollectionDialog from './EmailCollectionDialog';

interface ContentOverlayProps {
  children: React.ReactNode;
  className?: string;
}

const ContentOverlay: React.FC<ContentOverlayProps> = ({ children, className = '' }) => {
  const { user, subscription, createCheckoutSession, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Business logic: All logged-in users have premium access
  if (user) {
    return <>{children}</>;
  }

  const handleSubscribeClick = () => {
    console.log('🔔 [DEBUG] ContentOverlay subscribe button clicked');
    console.log('👤 [DEBUG] Current user:', user);
    console.log('🎯 [DEBUG] Subscription status:', subscription);
    
    if (user) {
      console.log('✅ [DEBUG] User is logged in, using email:', user.email);
      // User is logged in, use their email
      handleEmailSubmit(user.email!);
    } else {
      console.log('📧 [DEBUG] User not logged in, showing email dialog');
      // User is not logged in, collect email
      setShowEmailDialog(true);
    }
  };

  const handleEmailSubmit = async (email: string) => {
    console.log('📧 [DEBUG] ContentOverlay handleEmailSubmit called with:', email);
    setIsProcessingPayment(true);
    
    try {
      console.log('🚀 [DEBUG] Calling createCheckoutSession...');
      await createCheckoutSession(email);
      console.log('✅ [DEBUG] Checkout session created successfully');
      setShowEmailDialog(false);
    } catch (error) {
      console.error('❌ [DEBUG] ContentOverlay checkout error:', error);
      toast.error('Failed to create checkout session');
    } finally {
      setIsProcessingPayment(false);
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
                  onClick={handleSubscribeClick}
                  size="sm"
                  disabled={isProcessingPayment}
                  className="w-full bg-gradient-to-r from-fashion-600 to-fashion-800 hover:from-fashion-700 hover:to-fashion-900 text-white font-medium"
                >
                  <Lock className="h-3 w-3 mr-2" />
                  {isProcessingPayment ? 'Processing...' : 'Subscribe Now'}
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleSubscribeClick}
                    size="sm"
                    disabled={isProcessingPayment}
                    className="w-full bg-gradient-to-r from-fashion-600 to-fashion-800 hover:from-fashion-700 hover:to-fashion-900 text-white font-medium mb-2"
                  >
                    <Lock className="h-3 w-3 mr-2" />
                    {isProcessingPayment ? 'Processing...' : 'Subscribe Now'}
                  </Button>
                  <Button 
                    onClick={handleSignIn}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    Sign In
                  </Button>
                </>
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

      <EmailCollectionDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        onEmailSubmit={handleEmailSubmit}
        loading={isProcessingPayment}
      />
    </div>
  );
};

export default ContentOverlay;