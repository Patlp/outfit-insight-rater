import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, RefreshCw, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, subscription, checkSubscription } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'verified' | 'pending' | 'failed'>('checking');
  const [retryCount, setRetryCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const sessionId = searchParams.get('session_id');
  const maxRetries = 10;
  const retryDelay = 3000; // 3 seconds

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Start verification process
    verifyPayment();
    
    // Set up timer
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [user, navigate]);

  const verifyPayment = async () => {
    try {
      setVerificationStatus('checking');
      await checkSubscription();
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        if (subscription.subscribed) {
          setVerificationStatus('verified');
          toast.success('🎉 Payment verified! Welcome to Premium!');
        } else {
          handleRetryOrFail();
        }
      }, 1000);
    } catch (error) {
      console.error('Verification error:', error);
      handleRetryOrFail();
    }
  };

  const handleRetryOrFail = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setVerificationStatus('pending');
      setTimeout(verifyPayment, retryDelay);
    } else {
      setVerificationStatus('failed');
      toast.error('Payment verification taking longer than expected. Please try refreshing.');
    }
  };

  const handleManualRefresh = () => {
    setRetryCount(0);
    setTimeElapsed(0);
    verifyPayment();
  };

  const handleContinue = () => {
    navigate('/');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusContent = () => {
    switch (verificationStatus) {
      case 'checking':
      case 'pending':
        return {
          icon: <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />,
          title: 'Verifying Your Payment',
          description: 'Please wait while we confirm your subscription with Stripe...',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-900'
        };
      
      case 'verified':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: 'Payment Successful!',
          description: 'Your Premium subscription is now active. Enjoy all the premium features!',
          bgColor: 'bg-green-50',
          textColor: 'text-green-900'
        };
      
      case 'failed':
        return {
          icon: <AlertCircle className="h-8 w-8 text-amber-500" />,
          title: 'Verification Delayed',
          description: 'Your payment was successful, but verification is taking longer than usual. Try refreshing or contact support if the issue persists.',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-900'
        };
      
      default:
        return {
          icon: <Clock className="h-8 w-8 text-gray-500" />,
          title: 'Processing...',
          description: 'Please wait...',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-900'
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="min-h-screen bg-warm-cream flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${statusContent.bgColor} mx-auto mb-4`}>
            {statusContent.icon}
          </div>
          <CardTitle className={`text-xl ${statusContent.textColor}`}>
            {statusContent.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-gray-600 text-center">
            {statusContent.description}
          </p>

          {sessionId && (
            <div className="text-xs text-gray-500 text-center">
              Session ID: {sessionId.substring(0, 20)}...
            </div>
          )}

          {verificationStatus === 'checking' || verificationStatus === 'pending' ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Time elapsed:</span>
                <span>{formatTime(timeElapsed)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Retry attempt:</span>
                <span>{retryCount} / {maxRetries}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(retryCount / maxRetries) * 100}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            {verificationStatus === 'verified' ? (
              <Button onClick={handleContinue} className="w-full">
                Continue to App
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleManualRefresh} 
                  variant="outline" 
                  className="w-full"
                  disabled={verificationStatus === 'checking'}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
                
                <Button 
                  onClick={handleContinue} 
                  variant="secondary" 
                  className="w-full"
                >
                  Continue Anyway
                </Button>
              </>
            )}
          </div>

          {verificationStatus === 'failed' && (
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Need help? Contact our support team:
              </p>
              <Button 
                variant="link" 
                className="text-sm"
                onClick={() => window.open('mailto:support@ratemyfit.com', '_blank')}
              >
                support@ratemyfit.com
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;