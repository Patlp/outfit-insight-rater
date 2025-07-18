import React, { useState, useEffect } from 'react';
import { BodyType } from '@/context/RatingContext';
import { supabase } from '@/integrations/supabase/client';

interface BodyTypeSectionProps {
  bodyType: BodyType;
}

interface BodyTypeGuideData {
  type_name: string;
  category: string;
  description: string;
  physical_characteristics: string[];
  styling_guidelines: string[];
  recommended_fits: string[];
  recommended_fabrics: string[];
  recommended_cuts: string[];
  visual_representation_url?: string;
  height_range: string;
  weight_gain_pattern?: string[];
  specific_measurements?: string;
  bone_structure?: string;
  body_proportions?: string[];
  style_personality?: string;
}

const BodyTypeSection: React.FC<BodyTypeSectionProps> = ({ bodyType }) => {
  const [guideData, setGuideData] = useState<BodyTypeGuideData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGuideData = async () => {
      try {
        const { data, error } = await supabase
          .from('body_type_guide')
          .select('*')
          .eq('type_name', bodyType.type)
          .single();

        if (error) {
          console.warn('No specific guide data found for:', bodyType.type);
        } else {
          setGuideData(data);
        }
      } catch (err) {
        console.warn('Error fetching body type guide data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuideData();
  }, [bodyType.type]);

  // Enhanced shape visualization based on the body type
  const renderBodyTypeVisual = (type: string) => {
    const getVisualByType = (typeName: string) => {
      // Create simple SVG-based body shape representations
      const baseStyle = "w-24 h-32 mx-auto mb-4";
      
      if (typeName.toLowerCase().includes('gamine')) {
        return (
          <div className={`${baseStyle} relative`}>
            <svg viewBox="0 0 100 140" className="w-full h-full">
              {/* Gamine - Angular, narrow figure */}
              <path 
                d="M35 20 L65 20 L70 30 L75 60 L70 90 L65 120 L35 120 L30 90 L25 60 L30 30 Z" 
                fill="hsl(var(--fashion-100))" 
                stroke="hsl(var(--fashion-400))" 
                strokeWidth="2"
              />
              <circle cx="50" cy="15" r="8" fill="hsl(var(--fashion-200))" stroke="hsl(var(--fashion-400))" strokeWidth="1"/>
            </svg>
          </div>
        );
      }
      
      if (typeName.toLowerCase().includes('romantic')) {
        return (
          <div className={`${baseStyle} relative`}>
            <svg viewBox="0 0 100 140" className="w-full h-full">
              {/* Romantic - Soft, rounded figure */}
              <path 
                d="M30 25 Q45 20 50 20 Q55 20 70 25 Q75 35 75 50 Q72 65 70 80 Q75 95 75 110 Q65 120 50 120 Q35 120 25 110 Q25 95 30 80 Q28 65 25 50 Q25 35 30 25 Z" 
                fill="hsl(var(--fashion-100))" 
                stroke="hsl(var(--fashion-400))" 
                strokeWidth="2"
              />
              <circle cx="50" cy="15" r="8" fill="hsl(var(--fashion-200))" stroke="hsl(var(--fashion-400))" strokeWidth="1"/>
            </svg>
          </div>
        );
      }
      
      if (typeName.toLowerCase().includes('natural')) {
        return (
          <div className={`${baseStyle} relative`}>
            <svg viewBox="0 0 100 140" className="w-full h-full">
              {/* Natural - Broader, relaxed figure */}
              <path 
                d="M25 25 L75 25 L80 40 L78 60 L75 80 L70 100 L65 120 L35 120 L30 100 L25 80 L22 60 L20 40 Z" 
                fill="hsl(var(--fashion-100))" 
                stroke="hsl(var(--fashion-400))" 
                strokeWidth="2"
              />
              <circle cx="50" cy="15" r="8" fill="hsl(var(--fashion-200))" stroke="hsl(var(--fashion-400))" strokeWidth="1"/>
            </svg>
          </div>
        );
      }
      
      if (typeName.toLowerCase().includes('dramatic')) {
        return (
          <div className={`${baseStyle} relative`}>
            <svg viewBox="0 0 100 140" className="w-full h-full">
              {/* Dramatic - Tall, angular, balanced figure */}
              <path 
                d="M40 20 L60 20 L65 35 L70 55 L68 75 L70 95 L65 115 L60 125 L40 125 L35 115 L30 95 L32 75 L30 55 L35 35 Z" 
                fill="hsl(var(--fashion-100))" 
                stroke="hsl(var(--fashion-400))" 
                strokeWidth="2"
              />
              <circle cx="50" cy="15" r="8" fill="hsl(var(--fashion-200))" stroke="hsl(var(--fashion-400))" strokeWidth="1"/>
            </svg>
          </div>
        );
      }
      
      // Default shape
      return (
        <div className={`${baseStyle} bg-fashion-100 border-2 border-fashion-400 rounded-lg`}></div>
      );
    };

    return getVisualByType(type);
  };

  if (isLoading) {
    return (
      <div className="fashion-card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-fashion-200 rounded w-1/3"></div>
          <div className="h-32 bg-fashion-200 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-fashion-200 rounded"></div>
            <div className="h-4 bg-fashion-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fashion-card">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-fashion-900 mb-2">
          Your Body Type: {bodyType.type}
        </h3>
        
        {/* Visual representation */}
        <div className="mb-4">
          {renderBodyTypeVisual(bodyType.type)}
        </div>
        
        <div className="bg-fashion-50 rounded-lg p-4 mb-4">
          <p className="text-fashion-700 leading-relaxed font-medium">
            {guideData?.description || bodyType.description.replace(/Delicately angular beauty designed for thinking-dominant pituitary for analytical brain style detail-oriented personality/gi, 'Petite with sharp, angular features and a youthful appearance. Known for compact proportions and geometric lines.')}
          </p>
        </div>

        {/* Physical characteristics section */}
        {guideData?.specific_measurements && (
          <div className="bg-fashion-25 border border-fashion-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-fashion-800 mb-2">Physical Analysis</h4>
            <p className="text-sm text-fashion-700 mb-2">{guideData.specific_measurements}</p>
            {guideData?.height_range && (
              <p className="text-sm text-fashion-600 mt-2">
                Typical height: {guideData.height_range}
              </p>
            )}
            {guideData?.bone_structure && (
              <p className="text-sm text-fashion-600 mt-1">
                Bone structure: {guideData.bone_structure}
              </p>
            )}
            {guideData.body_proportions && guideData.body_proportions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {guideData.body_proportions.map((proportion, index) => (
                  <span key={index} className="px-2 py-1 bg-fashion-100 text-fashion-700 rounded text-xs">
                    {proportion}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Personality section */}
        {guideData?.style_personality && (
          <div className="bg-fashion-25 border border-fashion-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-fashion-800 mb-2">Typical Personality</h4>
            <p className="text-sm text-fashion-700 italic">{guideData.style_personality}</p>
          </div>
        )}

        {/* Weight gain pattern if available */}
        {guideData?.weight_gain_pattern && guideData.weight_gain_pattern.length > 0 && (
          <div className="bg-fashion-25 border border-fashion-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-fashion-800 mb-2">Weight Gain Pattern</h4>
            <div className="flex flex-wrap gap-1">
              {guideData.weight_gain_pattern.map((pattern, index) => (
                <span key={index} className="px-2 py-1 bg-fashion-200 text-fashion-800 rounded text-xs">
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced styling recommendations */}
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold text-fashion-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-fashion-500 rounded-full"></span>
            Styling Recommendations
          </h4>
          <div className="grid gap-3">
            {bodyType.stylingRecommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-fashion-50 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-fashion-500 mt-2 flex-shrink-0"></div>
                <span className="text-fashion-700 leading-relaxed">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Additional guide information if available */}
        {guideData && (
          <>
            {guideData.recommended_fits.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-fashion-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-fashion-500 rounded-full"></span>
                  Best Fits
                </h4>
                <div className="flex flex-wrap gap-2">
                  {guideData.recommended_fits.map((fit, index) => (
                    <span key={index} className="px-3 py-1 bg-fashion-100 text-fashion-800 rounded-full text-sm font-medium">
                      {fit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {guideData.recommended_fabrics.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-fashion-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-fashion-500 rounded-full"></span>
                  Recommended Fabrics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {guideData.recommended_fabrics.map((fabric, index) => (
                    <span key={index} className="px-3 py-1 bg-fashion-100 text-fashion-800 rounded-full text-sm font-medium">
                      {fabric}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BodyTypeSection;