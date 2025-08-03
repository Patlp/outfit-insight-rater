import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useStyleProfile, BodyTypeAnalysis, ColorAnalysis } from '@/hooks/useStyleProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BodyTypeConfirmation from './BodyTypeConfirmation';
import ColorAnalysisConfirmation from './ColorAnalysisConfirmation';
import EnhancedColorPaletteSection from './EnhancedColorPaletteSection';
import BodyTypeSection from './BodyTypeSection';
import ColorAnalysisSection from './ColorAnalysisSection';
import StylePhotoUpload from './StylePhotoUpload';

const AIStyleDNATab: React.FC = () => {
  const { user } = useAuth();
  const { styleProfile, loading, analyzing, analyzeBodyType, analyzeColorProfile, saveStyleProfile } = useStyleProfile();
  const { toast } = useToast();

  // Analysis states
  const [analysisStep, setAnalysisStep] = useState<'upload' | 'body_type' | 'color_analysis' | 'complete'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('female');
  const [bodyTypeAnalysis, setBodyTypeAnalysis] = useState<BodyTypeAnalysis | null>(null);
  const [colorAnalysis, setColorAnalysis] = useState<ColorAnalysis | null>(null);
  const [confirmedBodyType, setConfirmedBodyType] = useState<string | null>(null);
  const [confirmedColorAnalysis, setConfirmedColorAnalysis] = useState<ColorAnalysis | null>(null);

  // Check if user has existing complete profile
  useEffect(() => {
    if (styleProfile && styleProfile.body_type && styleProfile.seasonal_type) {
      setAnalysisStep('complete');
      setConfirmedBodyType(styleProfile.body_type);
      if (styleProfile.seasonal_type) {
        setConfirmedColorAnalysis({
          seasonalType: styleProfile.seasonal_type,
          skinTone: styleProfile.skin_tone as any || 'medium',
          undertone: styleProfile.undertone as any || 'neutral',
          hairColor: styleProfile.hair_color || 'brown',
          eyeColor: styleProfile.eye_color || 'brown',
          undertoneValue: styleProfile.undertone_value || 50,
          contrastValue: styleProfile.contrast_value || 50,
          depthValue: styleProfile.depth_value || 50,
          explanation: 'Previously analyzed'
        });
      }
    }
  }, [styleProfile]);

  const handleImageSelected = (base64: string) => {
    setSelectedImage(base64);
  };

  const startAnalysis = async () => {
    if (!selectedImage) {
      toast({
        title: "Image Required",
        description: "Please upload an image to analyze.",
        variant: "destructive"
      });
      return;
    }

    try {
      const imageBase64 = selectedImage.split(',')[1];
      
      // Analyze body type first
      const bodyResult = await analyzeBodyType(imageBase64, selectedGender);
      setBodyTypeAnalysis(bodyResult);
      setAnalysisStep('body_type');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const confirmBodyType = async (bodyType: string, isManualOverride: boolean) => {
    setConfirmedBodyType(bodyType);
    
    // Start color analysis
    if (selectedImage) {
      try {
        const imageBase64 = selectedImage.split(',')[1];
        const colorResult = await analyzeColorProfile(imageBase64, selectedGender);
        setColorAnalysis(colorResult);
        setAnalysisStep('color_analysis');
      } catch (error) {
        console.error('Color analysis failed:', error);
        toast({
          title: "Color Analysis Failed",
          description: "Failed to analyze colors. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const confirmColorAnalysis = async (colorData: ColorAnalysis, isManualOverride: boolean) => {
    setConfirmedColorAnalysis(colorData);
    
    // Save the complete profile
    try {
      await saveStyleProfile({
        body_type: confirmedBodyType!,
        body_type_manual_override: bodyTypeAnalysis ? confirmedBodyType !== bodyTypeAnalysis.bodyType : false,
        seasonal_type: colorData.seasonalType,
        skin_tone: colorData.skinTone,
        undertone: colorData.undertone,
        hair_color: colorData.hairColor,
        eye_color: colorData.eyeColor,
        undertone_value: colorData.undertoneValue,
        contrast_value: colorData.contrastValue,
        depth_value: colorData.depthValue,
        color_analysis_manual_override: isManualOverride,
        source_image_url: selectedImage,
        full_style_analysis: {
          bodyTypeAnalysis,
          colorAnalysis: colorData
        }
      });
      
      setAnalysisStep('complete');
      
      toast({
        title: "Profile Saved",
        description: "Your style profile has been successfully created!",
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetAnalysis = () => {
    setAnalysisStep('upload');
    setSelectedImage(null);
    setBodyTypeAnalysis(null);
    setColorAnalysis(null);
    setConfirmedBodyType(null);
    setConfirmedColorAnalysis(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-fashion-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-fashion-900 mb-2">Your Style DNA</h2>
        <p className="text-fashion-600">
          {analysisStep === 'complete' 
            ? "Your personalized style insights based on AI analysis"
            : "Upload a photo to discover your personalized style insights"
          }
        </p>
      </div>

      {/* Analysis Flow */}
      {analysisStep === 'upload' && (
        <div className="max-w-2xl mx-auto">
          <StylePhotoUpload
            onImageSelected={handleImageSelected}
            selectedImage={selectedImage}
            selectedGender={selectedGender}
            onGenderChange={setSelectedGender}
            onAnalyze={startAnalysis}
            isAnalyzing={analyzing}
          />
        </div>
      )}

      {analysisStep === 'body_type' && bodyTypeAnalysis && (
        <div className="max-w-2xl mx-auto">
          <BodyTypeConfirmation
            analysis={bodyTypeAnalysis}
            onConfirm={confirmBodyType}
            onEdit={resetAnalysis}
          />
        </div>
      )}

      {analysisStep === 'color_analysis' && colorAnalysis && (
        <div className="max-w-2xl mx-auto">
          <ColorAnalysisConfirmation
            analysis={colorAnalysis}
            onConfirm={confirmColorAnalysis}
            onEdit={resetAnalysis}
          />
        </div>
      )}

      {analysisStep === 'complete' && confirmedBodyType && confirmedColorAnalysis && (
        <div className="space-y-6">
          {/* Success Message */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-green-900 font-medium">Style DNA Analysis Complete!</p>
                <p className="text-green-700 text-sm">
                  Your personalized style insights are ready below.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetAnalysis}
                className="ml-auto"
              >
                Re-analyze
              </Button>
            </CardContent>
          </Card>

          {/* Style Analysis Results */}
          <Tabs defaultValue="body-type" className="w-full">
            <TabsList className="flex w-full">
              <TabsTrigger value="body-type" className="flex-1">Body Type</TabsTrigger>
              <TabsTrigger value="color-analysis" className="flex-1">Color Analysis</TabsTrigger>
              <TabsTrigger value="color-palette" className="flex-1">Color Palette</TabsTrigger>
            </TabsList>
            
            <TabsContent value="body-type" className="mt-6">
              <BodyTypeSection 
                bodyType={{
                  type: confirmedBodyType,
                  description: bodyTypeAnalysis?.explanation || 'AI-analyzed body type',
                  visualShape: bodyTypeAnalysis?.visualShape || 'Balanced silhouette',
                  stylingRecommendations: bodyTypeAnalysis?.stylingRecommendations || [],
                  bestFits: bodyTypeAnalysis?.bestFits || [],
                  recommendedFabrics: bodyTypeAnalysis?.recommendedFabrics || [],
                  whatNotToWear: bodyTypeAnalysis?.whatNotToWear || []
                }}
              />
            </TabsContent>
            
            <TabsContent value="color-analysis" className="mt-6">
              <ColorAnalysisSection 
                colorAnalysis={{
                  seasonalType: confirmedColorAnalysis.seasonalType,
                  undertone: {
                    value: confirmedColorAnalysis.undertoneValue,
                    description: confirmedColorAnalysis.undertone
                  },
                  intensity: {
                    value: confirmedColorAnalysis.contrastValue,
                    description: `${confirmedColorAnalysis.contrastValue < 33 ? 'Low' : confirmedColorAnalysis.contrastValue > 66 ? 'High' : 'Medium'} contrast`
                  },
                  lightness: {
                    value: confirmedColorAnalysis.depthValue,
                    description: `${confirmedColorAnalysis.depthValue < 33 ? 'Light' : confirmedColorAnalysis.depthValue > 66 ? 'Deep' : 'Medium'} coloring`
                  },
                  explanation: confirmedColorAnalysis.explanation
                }}
              />
            </TabsContent>
            
            <TabsContent value="color-palette" className="mt-6">
              <EnhancedColorPaletteSection
                seasonalType={confirmedColorAnalysis.seasonalType}
                bodyType={confirmedBodyType}
                skinTone={confirmedColorAnalysis.skinTone}
                undertone={confirmedColorAnalysis.undertone}
                gender={selectedGender}
                savedRecommendations={styleProfile?.full_style_analysis?.colorPalette?.categoryRecommendations}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default AIStyleDNATab;