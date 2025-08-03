import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStyleProfile } from '@/hooks/useStyleProfile';
import { Palette, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CategoryRecommendation {
  category: string;
  colors: string[];
  explanation: string;
  specificAdvice: string[];
}

interface EnhancedColorPaletteSectionProps {
  seasonalType?: string;
  bodyType?: string;
  skinTone?: string;
  undertone?: string;
  gender: 'male' | 'female';
  savedRecommendations?: CategoryRecommendation[];
}

const EnhancedColorPaletteSection: React.FC<EnhancedColorPaletteSectionProps> = ({
  seasonalType,
  bodyType,
  skinTone,
  undertone,
  gender,
  savedRecommendations
}) => {
  const [colorRecommendations, setColorRecommendations] = useState<CategoryRecommendation[]>(
    savedRecommendations || []
  );
  const [loading, setLoading] = useState(false);
  const [overallExplanation, setOverallExplanation] = useState('');
  const { generateColorPalette } = useStyleProfile();
  const { toast } = useToast();

  const canGenerate = seasonalType && bodyType && skinTone && undertone;

  const generatePalette = async () => {
    console.log('generatePalette called with canGenerate:', canGenerate);
    console.log('Values:', { seasonalType, bodyType, skinTone, undertone, gender });
    
    if (!canGenerate) {
      console.log('Cannot generate - missing data');
      toast({
        title: "Missing Information",
        description: "Please complete your body type and color analysis first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    console.log('Starting palette generation...');
    try {
      console.log('Calling generateColorPalette hook...');
      const result = await generateColorPalette(
        seasonalType!,
        bodyType!,
        skinTone!,
        undertone!,
        gender
      );
      
      console.log('Palette generation successful, result:', result);
      setColorRecommendations(result.categoryRecommendations);
      setOverallExplanation(result.overallExplanation);
      
      toast({
        title: "Success!",
        description: "Your color palette has been generated.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating palette in component:', error);
      console.error('Error details:', {
        message: error?.message,
        type: typeof error,
        stack: error?.stack
      });
      
      toast({
        title: "Generation Failed",
        description: error?.message || "Failed to generate color palette. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log('Palette generation finished');
    }
  };

  // Auto-generate on first load if all data is available
  useEffect(() => {
    if (canGenerate && colorRecommendations.length === 0) {
      generatePalette();
    }
  }, [canGenerate]);

  if (!canGenerate) {
    return (
      <Card className="fashion-card">
        <CardContent className="text-center py-8">
          <Palette className="h-12 w-12 text-fashion-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-fashion-900 mb-2">
            Color Palette Generator
          </h3>
          <p className="text-fashion-600 mb-4">
            Complete your body type and color analysis to generate your personalized color palette.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-fashion-900">Your Personal Color Palette</h3>
          <p className="text-sm text-fashion-600">
            AI-generated colors based on your {seasonalType} coloring and {bodyType} body type
          </p>
        </div>
        <Button
          onClick={generatePalette}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {colorRecommendations.length > 0 ? 'Regenerate' : 'Generate'} Palette
        </Button>
      </div>

      {/* Overall Explanation */}
      {overallExplanation && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-fashion-700 leading-relaxed">
              {overallExplanation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Color Categories */}
      {colorRecommendations.length > 0 ? (
        <div className="grid gap-6">
          {colorRecommendations.map((category, index) => (
            <Card key={index} className="fashion-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-fashion-900">
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Color Swatches */}
                <div className="grid grid-cols-6 gap-2">
                  {category.colors.map((color, colorIndex) => (
                    <div
                      key={colorIndex}
                      className="group relative"
                    >
                      <div
                        className="aspect-square rounded-lg shadow-sm border border-fashion-200 cursor-pointer transition-transform hover:scale-105"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {color}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div className="bg-fashion-25 border border-fashion-200 rounded-lg p-3">
                  <p className="text-sm text-fashion-700 leading-relaxed mb-2">
                    {category.explanation}
                  </p>
                </div>

                {/* Specific Advice */}
                {category.specificAdvice && category.specificAdvice.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-fashion-800 uppercase tracking-wide">
                      Styling Tips
                    </h5>
                    <div className="space-y-1">
                      {category.specificAdvice.map((advice, adviceIndex) => (
                        <div key={adviceIndex} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-fashion-500 mt-2 flex-shrink-0" />
                          <span className="text-xs text-fashion-700">{advice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-fashion-400 mx-auto mb-4" />
          <p className="text-fashion-600">Generating your personalized color palette...</p>
        </div>
      ) : null}
    </div>
  );
};

export default EnhancedColorPaletteSection;