import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, RefreshCw, Settings, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionStatusIndicatorProps {
  showRefreshButton?: boolean;
  compact?: boolean;
}

const SubscriptionStatusIndicator: React.FC<SubscriptionStatusIndicatorProps> = ({ 
  showRefreshButton = true, 
  compact = false 
}) => {
  const { user, subscription, checkSubscription, openCustomerPortal } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await checkSubscription();
      toast.success('Subscription status updated');
    } catch (error) {
      toast.error('Failed to refresh subscription status');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast.error('Failed to open customer portal');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  if (!user) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {subscription.subscribed ? (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        ) : (
          <Badge variant="outline" className="text-gray-600">
            Free
          </Badge>
        )}
        
        {showRefreshButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              subscription.subscribed ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {subscription.subscribed ? (
                <Crown className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-500" />
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  {subscription.subscribed ? 'Premium Account' : 'Free Account'}
                </h3>
                <Badge 
                  variant={subscription.subscribed ? "default" : "outline"}
                  className={subscription.subscribed ? "bg-green-100 text-green-800 border-green-200" : ""}
                >
                  {subscription.subscription_tier || 'Free'}
                </Badge>
              </div>
              
              {subscription.subscribed && subscription.subscription_end && (
                <p className="text-sm text-gray-600">
                  Renews on {formatDate(subscription.subscription_end)}
                </p>
              )}
              
              {!subscription.subscribed && (
                <p className="text-sm text-gray-600">
                  Upgrade to unlock premium features
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showRefreshButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            {subscription.subscribed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageSubscription}
              >
                <Settings className="h-4 w-4 mr-1" />
                Manage
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusIndicator;