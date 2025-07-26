import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUploadSession } from '@/context/UploadSessionContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Calendar, Star } from 'lucide-react';
import FeedbackSection from '@/components/rating/FeedbackSection';
import { toast } from 'sonner';

interface StoredOutfit {
  id: string;
  image_url: string;
  rating_score: number;
  feedback: string;
  suggestions: string[];
  created_at: string;
  occasion_context?: string;
  gender?: string;
}

const OutfitsTab: React.FC = () => {
  const { user } = useAuth();
  const { currentUpload, analysisResult } = useUploadSession();
  const [storedOutfits, setStoredOutfits] = useState<StoredOutfit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStoredOutfits = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('OutfitsTab: Fetching stored outfits for user:', user.id, new Date().toISOString());
    
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('OutfitsTab: Database error:', error);
        throw error;
      }
      
      console.log('OutfitsTab: Fetched outfits count:', data?.length || 0);
      setStoredOutfits(data || []);
    } catch (error) {
      console.error('OutfitsTab: Error fetching outfits:', error);
      toast.error('Failed to load your outfits');
    } finally {
      setLoading(false);
    }
  };

  // Single useEffect to handle initial load and user changes
  useEffect(() => {
    let mounted = true;
    
    if (user && mounted) {
      fetchStoredOutfits();
    }
    
    return () => {
      mounted = false;
    };
  }, [user?.id]); // Only depend on user.id to prevent infinite loops

  // Separate useEffect for outfit saved events
  useEffect(() => {
    const handleOutfitSaved = () => {
      console.log('OutfitsTab: Outfit saved event received');
      if (user) {
        // Small delay to ensure database has been updated
        setTimeout(() => {
          fetchStoredOutfits();
        }, 500);
      }
    };

    window.addEventListener('outfitSaved', handleOutfitSaved);
    return () => window.removeEventListener('outfitSaved', handleOutfitSaved);
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="w-24 h-24 bg-fashion-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-fashion-200 rounded w-3/4"></div>
                  <div className="h-4 bg-fashion-200 rounded w-1/2"></div>
                  <div className="h-4 bg-fashion-200 rounded w-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-fashion-900">Your Outfits</h2>
        <p className="text-fashion-600">All your style analyses and ratings</p>
        {storedOutfits.length > 0 && (
          <Button 
            onClick={() => window.location.href = '/'} 
            className="mt-4 bg-fashion-600 hover:bg-fashion-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload New Outfit
          </Button>
        )}
      </div>

      {/* Current Session Outfit (if exists) */}
      {currentUpload && analysisResult && (
        <Card className="border-fashion-300 bg-fashion-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-fashion-600" />
              Latest Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Image */}
              <div className="space-y-2">
                <div className="aspect-square rounded-lg overflow-hidden border border-fashion-200">
                  <img
                    src={currentUpload.imageBase64}
                    alt="Your latest outfit"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-2xl font-bold text-fashion-600">
                    <Star className="h-6 w-6" />
                    {analysisResult.score}/10
                  </div>
                  <p className="text-sm text-fashion-500">
                    {new Date(currentUpload.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Feedback */}
              <div className="lg:col-span-2">
                <FeedbackSection feedback={analysisResult.feedback} />
                
                {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-fashion-900 mb-2">Suggestions</h4>
                    <ul className="space-y-1">
                      {analysisResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-fashion-500 mt-1">•</span>
                          <span className="text-fashion-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stored Outfits */}
      {storedOutfits.length > 0 ? (
        <div className="space-y-4">
          {storedOutfits.map((outfit) => (
            <Card key={outfit.id}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Image and Score */}
                  <div className="space-y-2">
                    <div className="aspect-square rounded-lg overflow-hidden border border-fashion-200">
                      <img
                        src={outfit.image_url}
                        alt="Outfit"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-lg font-bold text-fashion-600">
                        <Star className="h-4 w-4" />
                        {outfit.rating_score}/10
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs text-fashion-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(outfit.created_at).toLocaleDateString()}
                      </div>
                      {outfit.occasion_context && (
                        <p className="text-xs text-fashion-600 mt-1 capitalize">
                          {outfit.occasion_context}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="lg:col-span-3">
                    <div className="text-sm text-fashion-700 leading-relaxed">
                      {outfit.feedback}
                    </div>
                    
                    {outfit.suggestions && outfit.suggestions.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium text-fashion-900 mb-1 text-sm">Suggestions</h5>
                        <ul className="space-y-1">
                          {outfit.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2 text-xs">
                              <span className="text-fashion-500 mt-0.5">•</span>
                              <span className="text-fashion-600">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Upload className="h-16 w-16 text-fashion-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-fashion-900 mb-2">
              No Outfits Yet
            </h3>
            <p className="text-fashion-600 mb-6">
              Start building your style profile by uploading your first outfit
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Upload Your First Outfit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OutfitsTab;