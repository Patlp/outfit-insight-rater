import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUploadSession } from '@/context/UploadSessionContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, ArrowLeft, X, Palette, Image } from 'lucide-react';
import SubscriptionStatusIndicator from '@/components/SubscriptionStatusIndicator';
import { RatingProvider } from '@/context/RatingContext';
import UploadArea from '@/components/UploadArea';
import RatingDisplay from '@/components/RatingDisplay';
import StyleDNATab from '@/components/dashboard/StyleDNATab';
import OutfitsTab from '@/components/dashboard/OutfitsTab';

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    // Only redirect if user is not authenticated and we're not still loading auth state
    if (!user && !loading) {
      navigate('/auth');
      return;
    }
  }, [user, loading, navigate]);

  const handleNewAnalysis = () => {
    setShowUpload(true);
  };

  const handleCloseUpload = () => {
    setShowUpload(false);
  };

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-warm-cream">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-fashion-600 hover:text-fashion-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-fashion-900">Your Dashboard</h1>
              <p className="text-fashion-600">Welcome back, {user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
              <Crown className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Premium Member</span>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="mb-8">
          <SubscriptionStatusIndicator showRefreshButton={true} compact={false} />
        </div>

        {/* Upload Interface Overlay */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-warm-cream rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-fashion-200">
                <h2 className="text-2xl font-bold text-fashion-900">New Style Analysis</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseUpload}
                  className="text-fashion-600 hover:text-fashion-800"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6">
                <RatingProvider>
                  <div className="space-y-6">
                    <UploadArea />
                    <RatingDisplay />
                  </div>
                </RatingProvider>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        <Tabs defaultValue="style-dna" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="style-dna" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Style DNA
            </TabsTrigger>
            <TabsTrigger value="outfits" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Outfits
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="style-dna" className="mt-6">
            <StyleDNATab />
          </TabsContent>
          
          <TabsContent value="outfits" className="mt-6">
            <OutfitsTab onNewAnalysis={handleNewAnalysis} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;