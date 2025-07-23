import React from 'react';
import { ColorPalette } from '@/context/RatingContext';
import WardrobeColorPaletteSection from './WardrobeColorPaletteSection';
import ContentOverlay from '@/components/ContentOverlay';

interface ColorPaletteSectionProps {
  colorPalette: ColorPalette;
}

const ColorPaletteSection: React.FC<ColorPaletteSectionProps> = ({ colorPalette }) => {
  // If we have category recommendations, show the new comprehensive wardrobe guide
  if (colorPalette.categoryRecommendations?.length) {
    return <WardrobeColorPaletteSection categoryRecommendations={colorPalette.categoryRecommendations} />;
  }

  // Fallback to traditional color grid
  return (
    <div className="fashion-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-fashion-900">Color Recommendations for Your Features</h3>
      </div>
      
      <ContentOverlay>
        <div className="mb-4">
          <div className="grid grid-cols-6 gap-1 mb-4">
            {colorPalette.colors.map((row, rowIndex) => 
              row.map((color, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="aspect-square rounded-lg shadow-sm border border-fashion-200"
                  style={{ backgroundColor: color }}
                  title={color}
                ></div>
              ))
            )}
          </div>
        </div>

        <p className="text-sm text-fashion-700 leading-relaxed">
          {colorPalette.explanation}
        </p>
      </ContentOverlay>
    </div>
  );
};

export default ColorPaletteSection;