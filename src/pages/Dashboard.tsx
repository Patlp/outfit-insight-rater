import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUploadSession } from '@/context/UploadSessionContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Upload, ArrowLeft, X } from 'lucide-react';
import SubscriptionStatusIndicator from '@/components/SubscriptionStatusIndicator';
import FeedbackSection from '@/components/rating/FeedbackSection';
import StyleAnalysisSection from '@/components/style/StyleAnalysisSection';
import ColorAnalysisSection from '@/components/style/ColorAnalysisSection';
import BodyTypeSection from '@/components/style/BodyTypeSection';
import { RatingProvider } from '@/context/RatingContext';
import UploadArea from '@/components/UploadArea';
import RatingDisplay from '@/components/RatingDisplay';

const Dashboard: React.FC = () => {
  const { user, subscription, loading } = useAuth();
  const { currentUpload, analysisResult, clearSession } = useUploadSession();
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    // Only redirect if user is not authenticated and we're not still loading auth state
    if (!user && !loading) {
      navigate('/auth');
      return;
    }
    
    // If user just came back from payment and has session data, show success message
    if (currentUpload && analysisResult) {
      console.log('Dashboard: User has session data from previous upload');
    }
  }, [user, loading, navigate, currentUpload, analysisResult]);

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

        {/* Current Analysis Results */}
        {analysisResult && currentUpload && !showUpload && (
          <div className="space-y-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Your Latest Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upload Preview */}
                  <div className="space-y-4">
                    <div className="aspect-square rounded-lg overflow-hidden border border-fashion-200">
                      <img
                        src={currentUpload.imageBase64}
                        alt="Your uploaded photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-fashion-600">
                        Analyzed on {new Date(currentUpload.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Analysis Results */}
                  <div className="space-y-4">
                    {/* Score Display */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-fashion-600 mb-2">
                            {analysisResult.score}/10
                          </div>
                          <div className="text-sm text-fashion-500">Style Score</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <FeedbackSection feedback={analysisResult.feedback} />
                    
                    {/* Suggestions */}
                    {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Style Suggestions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysisResult.suggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-fashion-500 mt-1">•</span>
                                <span className="text-fashion-700">{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Style Analysis - All logged-in users have access */}
            {analysisResult.styleAnalysis && (
              <div className="space-y-6">
                <StyleAnalysisSection styleAnalysis={analysisResult.styleAnalysis} />
                <ColorAnalysisSection colorAnalysis={analysisResult.styleAnalysis.colorAnalysis} />
                <BodyTypeSection bodyType={analysisResult.styleAnalysis.bodyType} />
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!analysisResult && !showUpload && (
          <Card className="text-center py-12">
            <CardContent>
              <Upload className="h-16 w-16 text-fashion-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-fashion-900 mb-2">
                No Recent Analysis
              </h3>
              <p className="text-fashion-600 mb-6">
                Upload a photo to get started with your style analysis
              </p>
              <Button onClick={handleNewAnalysis}>
                Start New Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {!showUpload && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button onClick={handleNewAnalysis} className="h-auto py-4">
                    <Upload className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">New Analysis</div>
                      <div className="text-xs opacity-75">Upload another photo</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;