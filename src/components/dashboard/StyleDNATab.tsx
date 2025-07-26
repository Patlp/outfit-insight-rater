import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, User, Eye } from 'lucide-react';
import StyleAnalysisSection from '@/components/style/StyleAnalysisSection';
import ColorAnalysisSection from '@/components/style/ColorAnalysisSection';
import ColorPaletteSection from '@/components/style/ColorPaletteSection';
import BodyTypeSection from '@/components/style/BodyTypeSection';
import { StyleAnalysis } from '@/context/RatingContext';

interface StoredOutfit {
  id: string;
  extracted_clothing_items: any;
}

const StyleDNATab: React.FC = () => {
  const { user } = useAuth();
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStyleAnalysis();
    }
  }, [user]);

  const fetchStyleAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('extracted_clothing_items')
        .eq('user_id', user!.id)
        .not('extracted_clothing_items', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const outfit = data[0] as StoredOutfit;
        const extractedData = outfit.extracted_clothing_items as any;
        
        if (extractedData?.styleAnalysis) {
          setStyleAnalysis(extractedData.styleAnalysis);
        }
      }
    } catch (error) {
      console.error('Error fetching style analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-fashion-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-fashion-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-fashion-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!styleAnalysis) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-2 text-fashion-400">
                <Palette className="h-8 w-8" />
                <User className="h-8 w-8" />
                <Eye className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-fashion-900">
                Discover Your Style DNA
              </h3>
              <p className="text-fashion-600 max-w-md">
                Upload an outfit to unlock your personalized color analysis, body type insights, and style recommendations tailored just for you.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-fashion-900 mb-2">Your Style DNA</h2>
        <p className="text-fashion-600">Personalized insights based on your unique features and style</p>
      </div>

      {/* Style Analysis Components */}
      <StyleAnalysisSection styleAnalysis={styleAnalysis} />
      
      {/* Individual Sections for Direct Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Your Color Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ColorAnalysisSection colorAnalysis={styleAnalysis.colorAnalysis} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Your Color Palette
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ColorPaletteSection colorPalette={styleAnalysis.colorPalette} />
          </CardContent>
        </Card>
      </div>

      {styleAnalysis.bodyType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Body Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BodyTypeSection bodyType={styleAnalysis.bodyType} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StyleDNATab;