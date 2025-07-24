import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, Calendar, Star, TrendingUp, Palette, User, Target } from 'lucide-react';
import { toast } from 'sonner';
import ColorAnalysisSection from '@/components/style/ColorAnalysisSection';
import ColorPaletteSection from '@/components/style/ColorPaletteSection';
import BodyTypeSection from '@/components/style/BodyTypeSection';

interface WardrobeItem {
  id: string;
  image_url: string;
  rating_score: number;
  created_at: string;
  feedback: string;
  suggestions: string[];
  occasion_context: string;
}

interface StyleAnalysis {
  colorAnalysis: any;
  colorPalette: any;
  bodyType: any;
}

const StyleProfile: React.FC = () => {
  const { user, subscription } = useAuth();
  const navigate = useNavigate();
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [firstUploadAnalysis, setFirstUploadAnalysis] = useState<StyleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<WardrobeItem | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!subscription?.subscribed) {
      navigate('/');
      return;
    }

    fetchWardrobeData();
  }, [user, subscription, navigate]);

  const fetchWardrobeData = async () => {
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setWardrobeItems(data || []);

        // Get style analysis from the first upload only
        if (data && data.length > 0) {
          const firstUpload = data[0];
          // Assuming the style analysis is stored in a separate field or needs to be reconstructed
          // For now, we'll check if there's any analysis data
          if (firstUpload.extracted_clothing_items) {
            try {
              const analysisData = typeof firstUpload.extracted_clothing_items === 'string' 
                ? JSON.parse(firstUpload.extracted_clothing_items)
                : firstUpload.extracted_clothing_items;
              if (analysisData.styleAnalysis) {
                setFirstUploadAnalysis(analysisData.styleAnalysis);
              }
            } catch (e) {
              console.log('No style analysis found in first upload');
            }
          }
        }
    } catch (error) {
      console.error('Error fetching wardrobe data:', error);
      toast.error('Failed to load your style profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNew = () => {
    navigate('/home');
  };

  const handleViewOutfit = (item: WardrobeItem) => {
    setSelectedOutfit(item);
  };

  const calculateProgress = () => {
    const current = wardrobeItems.length;
    const target = 100;
    const percentage = Math.min((current / target) * 100, 100);
    return { current, target, percentage };
  };

  const getMilestoneReached = () => {
    const current = wardrobeItems.length;
    return Math.floor(current / 10) * 10;
  };

  const { current, target, percentage } = calculateProgress();
  const milestoneReached = getMilestoneReached();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your style profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Your Style Profile</h1>
              <p className="text-muted-foreground">Your personalized fashion analytics and outfit history</p>
            </div>
            <Button onClick={handleUploadNew} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload New Outfit
            </Button>
          </div>
          
          {/* Progress Tracker */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Style Journey Progress
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {current} / {target} outfits uploaded
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {percentage.toFixed(0)}%
                </Badge>
              </div>
              
              <Progress value={percentage} className="h-3 mb-2" />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Start</span>
                <span>Milestone: {milestoneReached} outfits</span>
                <span>Goal: 100</span>
              </div>
              
              {milestoneReached > 0 && (
                <div className="mt-2 text-center">
                  <Badge variant="outline" className="text-primary border-primary">
                    🎉 {milestoneReached} Outfit Milestone Reached!
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Style Analytics Overview */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Style Analytics Overview
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Based on your first outfit analysis
                </p>
              </CardHeader>
            </Card>

            {firstUploadAnalysis ? (
              <div className="space-y-6">
                {firstUploadAnalysis.colorAnalysis && (
                  <ColorAnalysisSection colorAnalysis={firstUploadAnalysis.colorAnalysis} />
                )}
                
                {firstUploadAnalysis.colorPalette && (
                  <ColorPaletteSection colorPalette={firstUploadAnalysis.colorPalette} />
                )}
                
                {firstUploadAnalysis.bodyType && (
                  <BodyTypeSection bodyType={firstUploadAnalysis.bodyType} />
                )}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Style Analysis Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first outfit to get personalized style insights that will appear here permanently.
                </p>
                <Button onClick={handleUploadNew} variant="outline">
                  Upload Your First Outfit
                </Button>
              </Card>
            )}
          </div>

          {/* Outfit History Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Outfit History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {wardrobeItems.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {wardrobeItems.map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => handleViewOutfit(item)}
                      >
                        <div className="flex gap-3">
                          <img
                            src={item.image_url}
                            alt="Outfit"
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-semibold text-sm">
                                {item.rating_score}/10
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {new Date(item.created_at).toLocaleDateString()}
                            </p>
                            {item.occasion_context && (
                              <Badge variant="secondary" className="text-xs">
                                {item.occasion_context}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No outfits uploaded yet</p>
                    <Button 
                      onClick={handleUploadNew} 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                    >
                      Upload First Outfit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Outfit Detail Modal */}
        {selectedOutfit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Outfit Analysis</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedOutfit(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <img
                  src={selectedOutfit.image_url}
                  alt="Selected outfit"
                  className="w-full max-w-md mx-auto rounded-lg mb-4"
                />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="text-xl font-semibold">
                      {selectedOutfit.rating_score}/10
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Feedback</h4>
                    <p className="text-muted-foreground">{selectedOutfit.feedback}</p>
                  </div>
                  
                  {selectedOutfit.suggestions?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Suggestions</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {selectedOutfit.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    Uploaded on {new Date(selectedOutfit.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default StyleProfile;