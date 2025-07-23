import React from 'react';
import { CategoryColorRecommendation } from '@/context/RatingContext';
import { Palette, Shirt, Package, Footprints, Crown } from 'lucide-react';
import ContentOverlay from '@/components/ContentOverlay';

interface WardrobeColorPaletteSectionProps {
  categoryRecommendations: CategoryColorRecommendation[];
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'tops & blouses':
      return <Shirt className="w-5 h-5" />;
    case 'bottoms':
      return <Package className="w-5 h-5" />;
    case 'outerwear':
      return <Package className="w-5 h-5" />;
    case 'footwear':
      return <Footprints className="w-5 h-5" />;
    case 'accessories & jewelry':
      return <Crown className="w-5 h-5" />;
    default:
      return <Palette className="w-5 h-5" />;
  }
};

const WardrobeColorPaletteSection: React.FC<WardrobeColorPaletteSectionProps> = ({ 
  categoryRecommendations 
}) => {
  return (
    <div className="fashion-card mb-6">
      <div className="flex items-center gap-2 mb-6">
        <Palette className="w-6 h-6 text-fashion-600" />
        <h3 className="text-xl font-semibold text-fashion-900">
          Your Personal Wardrobe Color Guide
        </h3>
      </div>
      
      <p className="text-sm text-fashion-700 mb-8 leading-relaxed">
        These personalized color recommendations are tailored to your unique features, 
        skin tone, and body harmony. Each category provides specific colors that will 
        enhance your natural beauty and create stunning outfits.
      </p>

      <div className="grid gap-6">
        {categoryRecommendations.map((category, index) => (
          <div key={index} className="border border-fashion-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              {getCategoryIcon(category.category)}
              <h4 className="text-lg font-medium text-fashion-800">
                {category.category}
              </h4>
            </div>
            
            {/* Content overlay for detailed styling information */}
            <ContentOverlay>
              {/* Color swatches */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {category.colors.map((color, colorIndex) => (
                  <div
                    key={colorIndex}
                    className="aspect-square rounded-md shadow-sm border border-fashion-200 transition-transform hover:scale-105"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              
              {/* Explanation */}
              <p className="text-sm text-fashion-700 mb-3 leading-relaxed">
                {category.explanation}
              </p>
              
              {/* Specific advice */}
              <div className="space-y-1">
                <h5 className="text-sm font-medium text-fashion-800 mb-2">
                  Styling Tips:
                </h5>
                <ul className="space-y-1">
                  {category.specificAdvice.map((advice, adviceIndex) => (
                    <li 
                      key={adviceIndex} 
                      className="text-sm text-fashion-600 flex items-start gap-2"
                    >
                      <span className="text-fashion-400 mt-1">•</span>
                      <span>{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ContentOverlay>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WardrobeColorPaletteSection;