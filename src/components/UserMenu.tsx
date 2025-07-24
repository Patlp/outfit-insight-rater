import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, Crown, RefreshCw, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SubscriptionStatusIndicator from '@/components/SubscriptionStatusIndicator';

const UserMenu: React.FC = () => {
  const { user, signOut, subscription, createCheckoutSession, openCustomerPortal, checkSubscription } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = () => {
    // Use the proper checkout session flow
    createCheckoutSession();
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
          <DropdownMenuItem onClick={handleSubscribe}>
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Premium
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
    </DropdownMenu>
  );
};

export default UserMenu;