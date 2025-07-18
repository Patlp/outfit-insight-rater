import React from 'react';
import { StyleAnalysis } from '@/context/RatingContext';
import ColorAnalysisSection from './ColorAnalysisSection';
import ColorPaletteSection from './ColorPaletteSection';
import BodyTypeSection from './BodyTypeSection';

interface StyleAnalysisSectionProps {
  styleAnalysis: StyleAnalysis;
}

const StyleAnalysisSection: React.FC<StyleAnalysisSectionProps> = ({ styleAnalysis }) => {
  return (
    <div className="mt-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-fashion-900 mb-2">Your Style Analysis</h2>
        <p className="text-fashion-600 text-sm">Personalized insights based on your features</p>
      </div>

      <ColorAnalysisSection colorAnalysis={styleAnalysis.colorAnalysis} />
      
      <ColorPaletteSection colorPalette={styleAnalysis.colorPalette} />
      
      {styleAnalysis.bodyType && (
        <BodyTypeSection bodyType={styleAnalysis.bodyType} />
      )}
    </div>
  );
};

export default StyleAnalysisSection;