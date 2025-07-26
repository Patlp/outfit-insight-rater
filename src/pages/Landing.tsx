import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RatingProvider } from '@/context/RatingContext';
import GenderToggle from '@/components/GenderToggle';
import UploadArea from '@/components/UploadArea';
import RatingDisplay from '@/components/RatingDisplay';
import PrivacyNotice from '@/components/PrivacyNotice';
import RoastModeToggle from '@/components/RoastModeToggle';
import InviteWall from '@/components/InviteWall';
import UserMenu from '@/components/UserMenu';
import { useRating } from '@/context/RatingContext';
import { useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Sparkles, Palette, User, Crown } from 'lucide-react';
import PremiumAccessMessage from '@/components/PremiumAccessMessage';

const PremiumBenefitsSection: React.FC = () => {
  const { user } = useAuth();

  // Only show for anonymous users
  if (user) {
    return null;
  }

  const handleSubscribeClick = () => {
    console.log('🔔 [DEBUG] Landing premium button clicked - redirecting to Stripe');
    window.open('https://buy.stripe.com/9B6cN5cVQ7KlgWd5mV3cc01', '_blank');
  };

  const benefits = [
    '🎨 Discover your ideal color palette for glowing skin and sharper outfits',
    '👕 Get a wardrobe guide tailored to your exact tone and proportions',
    '🧍‍♀️ Learn your body type and get styling strategies that flatter, not fight, your shape',
    '💾 Save every outfit, track what works, and watch your style evolve',
    '🧠 See how each outfit aligns with your unique style fingerprint',
    '🔁 Reduce decision fatigue, boost confidence, and walk out the door with certainty'
  ];

  return (
    <div className="w-full max-w-6xl mx-auto mb-12">
      {/* Premium Hero Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="h-8 w-8 text-fashion-600" />
          <h1 className="text-4xl md:text-5xl font-bold text-fashion-900">
            RateMyFit <span className="text-fashion-600">Premium</span>
          </h1>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-fashion-700 mb-6">
          Look Better. Feel Better. Every Day.
        </h2>
        <p className="text-lg text-fashion-700 mb-8 max-w-4xl mx-auto leading-relaxed">
          Unlock personalized fashion insights built around you—your unique colors, body type, and style DNA. 
          No more guesswork. No more outfit anxiety. Just real confidence, built from the clothes you already own.
        </p>
        
        {/* Benefits List */}
        <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3 text-left">
              <span className="flex-shrink-0 w-6 h-6 bg-fashion-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <span className="text-fashion-700 leading-relaxed">{benefit}</span>
            </div>
          ))}
        </div>

        <Button 
          onClick={handleSubscribeClick}
          size="lg"
          className="bg-fashion-600 hover:bg-fashion-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 mb-6"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Just £5/month
        </Button>
        
        <div className="space-y-3 mb-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-fashion-700 font-medium">
              Instant AI insights after your first upload
            </span>
          </div>
          <div className="flex items-start justify-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-fashion-700 font-medium">
              100% guaranteed to improve how you look—and how you feel—or your money back
            </span>
          </div>
        </div>
      </div>

      {/* Premium Features Showcase */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Color Analysis Feature */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="mb-4">
            <Badge variant="secondary" className="bg-fashion-100 text-fashion-700 mb-2">
              <Palette className="h-4 w-4 mr-1" />
              Color Analysis
            </Badge>
            <h3 className="text-xl font-semibold text-fashion-900 mb-2">
              Your Personal Color Type
            </h3>
            <p className="text-fashion-600 text-sm mb-4">
              Discover your seasonal color type and get detailed analysis of your skin undertones, 
              natural contrast, and depth to find colors that make you glow.
            </p>
          </div>
          <div className="relative rounded-lg overflow-hidden shadow-md">
            <img 
              src="/lovable-uploads/1fbf3738-5ab6-4132-8122-a7e61640a9bc.png"
              alt="Color Analysis Example - Cool Winter type with undertone, contrast and depth analysis"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </Card>

        {/* Color Palette Feature */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="mb-4">
            <Badge variant="secondary" className="bg-fashion-100 text-fashion-700 mb-2">
              <Sparkles className="h-4 w-4 mr-1" />
              Wardrobe Guide
            </Badge>
            <h3 className="text-xl font-semibold text-fashion-900 mb-2">
              Personal Color Palette
            </h3>
            <p className="text-fashion-600 text-sm mb-4">
              Get specific color recommendations for tops, bottoms, and accessories 
              tailored to enhance your natural beauty and create stunning outfits.
            </p>
          </div>
          <div className="relative rounded-lg overflow-hidden shadow-md">
            <img 
              src="/lovable-uploads/6562ad07-ebd6-4437-87b7-4bde9739a730.png"
              alt="Personal Wardrobe Color Guide with curated color palettes for different clothing categories"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </Card>

        {/* Body Type Feature */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="mb-4">
            <Badge variant="secondary" className="bg-fashion-100 text-fashion-700 mb-2">
              <User className="h-4 w-4 mr-1" />
              Body Analysis
            </Badge>
            <h3 className="text-xl font-semibold text-fashion-900 mb-2">
              Body Type Styling
            </h3>
            <p className="text-fashion-600 text-sm mb-4">
              Understand your body type with detailed analysis and receive personalized 
              styling recommendations for garment fit and silhouette alignment.
            </p>
          </div>
          <div className="relative rounded-lg overflow-hidden shadow-md">
            <img 
              src="/lovable-uploads/a3a076fa-dd2b-45a6-b7e4-cec08d357d9e.png"
              alt="Body Type Analysis example showing Natural Ag type with physical analysis and styling recommendations"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </Card>
      </div>

      {/* Final CTA */}
      <div className="text-center mb-16">
        <p className="text-fashion-600 mb-4">
          Start with our free outfit rating below, then unlock your complete style profile
        </p>
        <Button 
          onClick={handleSubscribeClick}
          variant="outline"
          className="border-fashion-600 text-fashion-600 hover:bg-fashion-600 hover:text-white"
        >
          Upgrade to Premium - £5.00/month
        </Button>
      </div>
    </div>
  );
};

const LandingContent: React.FC = () => {
  const { ratingResult } = useRating();
  const { user, subscription } = useAuth();
  const navigate = useNavigate();
  
  // Allow users to navigate freely - don't auto-redirect
  
  // Initialize error recovery
  useErrorRecovery({
    onError: (error) => {
      console.error('Global error caught:', error);
      performanceMonitor.logMemoryUsage('error-recovery');
    }
  });
  
  React.useEffect(() => {
    performanceMonitor.logMemoryUsage('component-mount');
    console.log('LandingContent mounted successfully');
  }, []);
  
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col items-center">
      <header className="text-center mb-8 relative w-full">
        <div className="absolute top-4 right-4">
          <UserMenu />
        </div>
        <img 
          src="/lovable-uploads/3c887a45-fcd4-4fa5-8558-f2c9bbe856f9.png" 
          alt="RateMyFit Logo" 
          className="h-72 sm:h-80 md:h-96 mx-auto mb-4" 
        />
        <p className="text-gray-600 max-w-md mx-auto mb-4">
          Upload your outfit photo and get instant AI-powered style feedback and improvement suggestions
        </p>
        <Button 
          onClick={() => document.getElementById('free-rating-tool')?.scrollIntoView({ behavior: 'smooth' })}
          variant="outline"
          className="border-fashion-600 text-fashion-600 hover:bg-fashion-600 hover:text-white"
        >
          Try Free AI Rating Now
        </Button>
      </header>

      {/* Premium Benefits Section - only for anonymous users */}
      <PremiumBenefitsSection />
      
      {/* Premium Access Message - only for logged-in users */}
      <PremiumAccessMessage />
      
      {/* Upload Section */}
      <div id="free-rating-tool" className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-fashion-900 mb-2">
            {user ? 'Upload Your Outfit' : 'Try Our Free Outfit Rating'}
          </h2>
          <p className="text-fashion-600">
            {user 
              ? 'Get detailed style analysis with your premium access'
              : 'Get started with a basic AI rating, then unlock detailed insights with Premium'
            }
          </p>
        </div>

        <GenderToggle />
        <InviteWall />
        
        <div className="mb-8">
          <UploadArea />
        </div>
        
        <RoastModeToggle />
        
        {ratingResult && <RatingDisplay />}
        
        <PrivacyNotice />
      </div>
    </div>
  );
};

const Landing: React.FC = () => {
  return (
    <ErrorBoundary>
      <RatingProvider>
        <div className="min-h-screen bg-warm-cream">
          <LandingContent />
          <Toaster position="bottom-center" />
        </div>
      </RatingProvider>
    </ErrorBoundary>
  );
};

export default Landing;