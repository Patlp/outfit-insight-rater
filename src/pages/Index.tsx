
import React, { useState, useEffect } from 'react';
import { Camera, Upload, Star, TrendingUp, Users, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UploadArea from '@/components/UploadArea';
import RatingDisplay from '@/components/RatingDisplay';
import InviteWall from '@/components/InviteWall';
import AuthModal from '@/components/auth/AuthModal';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Index = () => {
  const { user, loading, signInWithPinterest } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pinterestLoading, setPinterestLoading] = useState(false);

  // Redirect authenticated users to wardrobe
  useEffect(() => {
    if (!loading && user) {
      console.log('✅ User authenticated, redirecting to wardrobe');
      navigate('/wardrobe');
    }
  }, [user, loading, navigate]);

  const handlePinterestLogin = async () => {
    setPinterestLoading(true);
    try {
      const { error } = await signInWithPinterest();
      if (error) {
        console.error('Pinterest OAuth error:', error);
        toast.error('Failed to connect with Pinterest. Please try again.');
      } else {
        toast.info('Redirecting to Pinterest...');
      }
    } catch (error) {
      console.error('Pinterest login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setPinterestLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-fashion-500"></div>
      </div>
    );
  }

  // Don't render the main content if user is authenticated (they'll be redirected)
  if (user) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-fashion-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-cream">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fashion-50 to-warm-cream opacity-50"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-fashion-500" />
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
                Rate<span className="text-fashion-500">My</span>Fit
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Get instant AI-powered fashion feedback and discover your style potential with personalized outfit ratings
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button
                onClick={handlePinterestLogin}
                disabled={pinterestLoading}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                {pinterestLoading ? 'Connecting...' : 'Sign in with Pinterest'}
              </Button>
              
              <Button
                onClick={() => setShowAuthModal(true)}
                variant="outline"
                size="lg"
                className="border-fashion-500 text-fashion-700 hover:bg-fashion-50 px-8 py-3 text-lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              Connect with Pinterest to sync your style boards automatically
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Discover Your Style Potential
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload a photo and get instant feedback with AI-powered analysis and personalized styling suggestions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-fashion-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-fashion-100 rounded-lg flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-fashion-600" />
              </div>
              <CardTitle className="text-xl">Instant Analysis</CardTitle>
              <CardDescription>
                Upload any outfit photo and get detailed feedback in seconds using advanced AI technology
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-fashion-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-fashion-100 rounded-lg flex items-center justify-center mb-4">
                <ExternalLink className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Pinterest Integration</CardTitle>
              <CardDescription>
                Connect your Pinterest account to automatically sync style boards and get inspiration from your pins
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-fashion-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-fashion-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-fashion-600" />
              </div>
              <CardTitle className="text-xl">Style Improvement</CardTitle>
              <CardDescription>
                Get actionable suggestions to enhance your look and build a wardrobe that works for you
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Pinterest Benefits */}
        <div className="bg-red-50 rounded-2xl p-8 mb-16">
          <div className="text-center mb-8">
            <ExternalLink className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Enhanced with Pinterest
            </h3>
            <p className="text-gray-600">
              Sign in with Pinterest to unlock advanced features and seamless style management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Auto-Import Style Boards</h4>
                <p className="text-gray-600 text-sm">Automatically discover and import your fashion-related Pinterest boards</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Smart Fashion Detection</h4>
                <p className="text-gray-600 text-sm">AI-powered filtering to find only your most relevant style content</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Instant Outfit Inspiration</h4>
                <p className="text-gray-600 text-sm">Transform your Pinterest saves into actionable outfit inspiration</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Seamless Sync</h4>
                <p className="text-gray-600 text-sm">Keep your style inspiration updated automatically with daily syncing</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button
              onClick={handlePinterestLogin}
              disabled={pinterestLoading}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              {pinterestLoading ? 'Connecting...' : 'Connect Pinterest Account'}
            </Button>
          </div>
        </div>

        {/* Demo Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Try It Now - No Account Required
            </h3>
            <p className="text-gray-600">
              Upload a photo to see how our AI analyzes your outfit
            </p>
          </div>
          
          <UploadArea />
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Sign up to save your ratings and access advanced features
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-fashion-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Join Thousands of Style Enthusiasts
            </h3>
            <div className="flex justify-center items-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-fashion-600" />
                <span className="text-lg font-semibold">10,000+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-fashion-600" />
                <span className="text-lg font-semibold">50,000+ Ratings</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-fashion-600" />
                <span className="text-lg font-semibold">95% Improved Style</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <Footer />
    </div>
  );
};

export default Index;
