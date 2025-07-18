import React from 'react';
import { StyleAnalysis } from '@/context/RatingContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

      <Tabs defaultValue="color-analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="color-analysis">Color Analysis</TabsTrigger>
          <TabsTrigger value="color-palette">Color Palette</TabsTrigger>
          <TabsTrigger value="body-type">Body Type</TabsTrigger>
        </TabsList>
        
        <TabsContent value="color-analysis" className="mt-6">
          <ColorAnalysisSection colorAnalysis={styleAnalysis.colorAnalysis} />
        </TabsContent>
        
        <TabsContent value="color-palette" className="mt-6">
          <ColorPaletteSection colorPalette={styleAnalysis.colorPalette} />
        </TabsContent>
        
        <TabsContent value="body-type" className="mt-6">
          {styleAnalysis.bodyType ? (
            <BodyTypeSection bodyType={styleAnalysis.bodyType} />
          ) : (
            <div className="fashion-card text-center py-8">
              <p className="text-fashion-600">Body type analysis will be available after uploading a full-body photo.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StyleAnalysisSection;