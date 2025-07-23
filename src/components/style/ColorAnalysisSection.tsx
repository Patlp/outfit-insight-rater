import React from 'react';
import { ColorAnalysis } from '@/context/RatingContext';
import ContentOverlay from '@/components/ContentOverlay';

interface ColorAnalysisSectionProps {
  colorAnalysis: ColorAnalysis;
}

const ColorAnalysisSection: React.FC<ColorAnalysisSectionProps> = ({ colorAnalysis }) => {
  return (
    <div className="fashion-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-fashion-900">Your Personal Color Type</h3>
      </div>
      
      <ContentOverlay>
        <div className="mb-6">
          <h4 className="text-xl font-bold text-fashion-800 mb-2">{colorAnalysis.seasonalType}</h4>
          <p className="text-fashion-700 text-sm leading-relaxed">
            {colorAnalysis.explanation}
          </p>
        </div>

        <div className="space-y-6">
          {/* Undertone Scale */}
          <div>
            <h5 className="text-sm font-medium text-fashion-800 mb-2">YOUR SKIN UNDERTONE</h5>
            <p className="text-xs text-fashion-600 mb-3">From cool to warm undertones in your natural skin tone</p>
            <div className="relative">
              <div className="h-12 rounded-lg overflow-hidden bg-gradient-to-r from-blue-400 via-gray-400 to-orange-400"></div>
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-16 h-8 border-2 border-white rounded-sm bg-white/20"
                style={{ left: `calc(${colorAnalysis.undertone.value}% - 32px)` }}
              ></div>
            </div>
            <p className="text-xs text-fashion-600 mt-2">{colorAnalysis.undertone.description}</p>
          </div>

          {/* Intensity Scale */}
          <div>
            <h5 className="text-sm font-medium text-fashion-800 mb-2">YOUR NATURAL CONTRAST</h5>
            <p className="text-xs text-fashion-600 mb-3">Based on the contrast between your hair, skin, and eyes</p>
            <div className="relative">
              <div className="h-12 rounded-lg overflow-hidden bg-gradient-to-r from-red-600 via-red-300 to-red-100"></div>
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-16 h-8 border-2 border-white rounded-sm bg-white/20"
                style={{ left: `calc(${colorAnalysis.intensity.value}% - 32px)` }}
              ></div>
            </div>
            <p className="text-xs text-fashion-600 mt-2">{colorAnalysis.intensity.description}</p>
          </div>

          {/* Value/Lightness Scale */}
          <div>
            <h5 className="text-sm font-medium text-fashion-800 mb-2">YOUR NATURAL DEPTH</h5>
            <p className="text-xs text-fashion-600 mb-3">The overall lightness or depth of your natural coloring</p>
            <div className="relative">
              <div className="h-12 rounded-lg overflow-hidden bg-gradient-to-r from-green-100 via-green-400 to-green-900"></div>
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-16 h-8 border-2 border-white rounded-sm bg-white/20"
                style={{ left: `calc(${colorAnalysis.lightness.value}% - 32px)` }}
              ></div>
            </div>
            <p className="text-xs text-fashion-600 mt-2">{colorAnalysis.lightness.description}</p>
          </div>
        </div>
      </ContentOverlay>
    </div>
  );
};

export default ColorAnalysisSection;