import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Bug, RefreshCw, TestTube2 } from 'lucide-react';
import { toast } from 'sonner';

const DebugPanel: React.FC = () => {
  const { user, session, subscription, createCheckoutSession, checkSubscription } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [testingPayment, setTestingPayment] = useState(false);

  const handleTestPayment = async () => {
    console.log('🧪 [DEBUG] Testing payment flow...');
    setTestingPayment(true);
    
    try {
      const testEmail = user?.email || 'test@example.com';
      console.log('🧪 [DEBUG] Using test email:', testEmail);
      await createCheckoutSession(testEmail);
    } catch (error) {
      console.error('🧪 [DEBUG] Payment test failed:', error);
      toast.error('Payment test failed - check console for details');
    } finally {
      setTestingPayment(false);
    }
  };

  const handleTestRefresh = async () => {
    console.log('🧪 [DEBUG] Testing subscription refresh...');
    try {
      await checkSubscription();
      toast.success('Subscription refresh test completed');
    } catch (error) {
      console.error('🧪 [DEBUG] Refresh test failed:', error);
      toast.error('Refresh test failed - check console for details');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-white/90 border-red-300 text-red-700 hover:bg-red-50"
          >
            <Bug className="h-4 w-4 mr-2" />
            Debug Panel
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="mt-2 w-80 bg-white/95 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center text-red-700">
                <Bug className="h-4 w-4 mr-2" />
                Debug Information
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3 text-xs">
              <div>
                <strong>User Status:</strong>
                <div className="ml-2 text-gray-600">
                  <div>Logged in: {user ? '✅ Yes' : '❌ No'}</div>
                  {user && <div>Email: {user.email}</div>}
                  <div>Session: {session ? '✅ Active' : '❌ None'}</div>
                </div>
              </div>
              
              <div>
                <strong>Subscription Status:</strong>
                <div className="ml-2 text-gray-600">
                  <div>Subscribed: {subscription.subscribed ? '✅ Yes' : '❌ No'}</div>
                  <div>Tier: {subscription.subscription_tier || 'None'}</div>
                  <div>Checking: {subscription.isChecking ? '🔄 Yes' : '❌ No'}</div>
                  <div>Last Checked: {subscription.lastChecked ? subscription.lastChecked.toLocaleTimeString() : 'Never'}</div>
                </div>
              </div>

              <div>
                <strong>Environment:</strong>
                <div className="ml-2 text-gray-600">
                  <div>URL: {window.location.href}</div>
                  <div>Origin: {window.location.origin}</div>
                </div>
              </div>
              
              <div className="pt-2 space-y-2">
                <Button 
                  onClick={handleTestPayment}
                  disabled={testingPayment}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <TestTube2 className="h-3 w-3 mr-2" />
                  {testingPayment ? 'Testing...' : 'Test Payment Flow'}
                </Button>
                
                <Button 
                  onClick={handleTestRefresh}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Test Subscription Refresh
                </Button>
              </div>

              <div className="pt-2 text-xs text-gray-500">
                💡 Check browser console for detailed logs
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default DebugPanel;