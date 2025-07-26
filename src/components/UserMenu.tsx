import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, Crown, RefreshCw, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SubscriptionStatusIndicator from '@/components/SubscriptionStatusIndicator';
import EmailCollectionDialog from './EmailCollectionDialog';

const UserMenu: React.FC = () => {
  const { user, signOut, subscription, createCheckoutSession, openCustomerPortal, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleSubscribeClick = () => {
    console.log('🔔 [DEBUG] UserMenu subscribe button clicked');
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
    console.log('📧 [DEBUG] UserMenu handleEmailSubmit called with:', email);
    setIsProcessingPayment(true);
    
    try {
      console.log('🚀 [DEBUG] Calling createCheckoutSession...');
      await createCheckoutSession(email);
      console.log('✅ [DEBUG] Checkout session created successfully');
      setShowEmailDialog(false);
    } catch (error) {
      console.error('❌ [DEBUG] UserMenu checkout error:', error);
      toast.error('Failed to create checkout session');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast.error('Failed to open customer portal. Please try again.');
    }
  };

  const handleRefreshSubscription = async () => {
    try {
      await checkSubscription();
      toast.success('Subscription status refreshed');
    } catch (error) {
      toast.error('Failed to refresh subscription status');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  if (!user) {
    return (
      <Button 
        onClick={() => navigate('/auth')}
        variant="outline"
        size="sm"
        className="text-fashion-700 border-fashion-300 hover:bg-fashion-50"
      >
        Sign In
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72">
        <div className="p-2">
          <div className="flex flex-col space-y-1 mb-3">
            <span className="font-medium text-sm">{user.email}</span>
            <SubscriptionStatusIndicator compact showRefreshButton={false} />
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/dashboard')}>
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Dashboard
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleRefreshSubscription} disabled={subscription.isChecking}>
          <RefreshCw className={`h-4 w-4 mr-2 ${subscription.isChecking ? 'animate-spin' : ''}`} />
          Refresh Status
        </DropdownMenuItem>
        
        {!subscription.subscribed ? (
          <DropdownMenuItem onClick={handleSubscribeClick} disabled={isProcessingPayment}>
            <Crown className="h-4 w-4 mr-2" />
            {isProcessingPayment ? 'Processing...' : 'Upgrade to Premium'}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleManageSubscription}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Subscription
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>

      <EmailCollectionDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        onEmailSubmit={handleEmailSubmit}
        loading={isProcessingPayment}
      />
    </DropdownMenu>
  );
};

export default UserMenu;