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
  const { user } = useAuth();
  const navigate = useNavigate();

  // Business logic: All logged-in users have premium access
  if (user) {
    return <>{children}</>;
  }

  const handleSubscribeClick = () => {
    console.log('🔔 [DEBUG] ContentOverlay button clicked - redirecting to Stripe');
    window.open('https://buy.stripe.com/9B6cN5cVQ7KlgWd5mV3cc01', '_blank');
  };

  const handleSignIn = () => {
    navigate('/auth');
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
              <Button 
                onClick={handleSubscribeClick}
                size="sm"
                className="w-full bg-gradient-to-r from-fashion-600 to-fashion-800 hover:from-fashion-700 hover:to-fashion-900 text-white font-medium mb-2"
              >
                <Lock className="h-3 w-3 mr-2" />
                Subscribe Now
              </Button>
              <Button 
                onClick={handleSignIn}
                size="sm"
                variant="outline"
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentOverlay;