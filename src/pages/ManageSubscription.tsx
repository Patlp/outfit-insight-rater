import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageSubscription: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleEmailClick = () => {
    const subject = encodeURIComponent('Subscription Cancellation Request');
    const body = encodeURIComponent(`Hello,

I would like to cancel my subscription.

Account Email: ${user?.email || 'Not available'}

Thank you for your assistance.

Best regards`);
    
    window.open(`mailto:hollandoak123@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
              Manage Your Subscription
            </h1>
            <p className="text-muted-foreground text-lg">
              Need to make changes to your subscription? We're here to help.
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <Mail className="w-6 h-6 text-primary" />
                Subscription Cancellation
              </CardTitle>
              <CardDescription className="text-base">
                To cancel your subscription, please contact our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-6 border border-border/30">
                <h3 className="font-semibold mb-3 text-lg">How to Cancel</h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>To cancel your subscription, please send an email to:</p>
                  <div className="bg-background rounded-md p-3 border border-border/50">
                    <p className="font-mono text-sm text-primary font-medium">
                      hollandoak123@gmail.com
                    </p>
                  </div>
                  <p>Please include your account email in the cancellation request:</p>
                  <div className="bg-background rounded-md p-3 border border-border/50">
                    <p className="font-mono text-sm text-foreground">
                      {user?.email || 'Your account email'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  onClick={handleEmailClick}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg shadow-md"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Send Cancellation Email
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  This will open your email client with a pre-filled message
                </p>
              </div>

              <div className="bg-muted/20 rounded-lg p-4 border border-border/30">
                <h4 className="font-medium mb-2 text-sm">Note:</h4>
                <p className="text-sm text-muted-foreground">
                  Our team will process your cancellation request within 24 hours. 
                  You'll continue to have access to premium features until the end of your current billing period.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManageSubscription;