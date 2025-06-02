
import React from 'react';
import { ExternalLink, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseProductSuggestions } from '@/utils/productSuggestionParser';
import { generateAmazonSearchUrl } from '@/utils/regionDetection';
import { useRating } from '@/context/RatingContext';

interface ProductRecommendationsSectionProps {
  feedback: string;
  suggestions: string[];
}

const ProductRecommendationsSection: React.FC<ProductRecommendationsSectionProps> = ({ 
  feedback, 
  suggestions 
}) => {
  const { selectedGender } = useRating();
  const productSuggestions = parseProductSuggestions(suggestions, selectedGender);

  if (!productSuggestions || productSuggestions.length === 0) {
    return null;
  }

  const generateRecommendationExplanation = (product: any): string => {
    // Use the context that's already provided in the product object
    return product.context || "This piece will complement your personal style perfectly and help elevate your overall appearance.";
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4 text-fashion-600 border-b border-fashion-200 pb-2 flex items-center gap-2">
        <ShoppingBag size={20} />
        Recommended Products
      </h3>
      
      {/* Desktop: side-by-side layout */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {productSuggestions.map((product, index) => (
          <div 
            key={index} 
            className="bg-white border border-fashion-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <h4 className="font-semibold text-gray-900 mb-2">
              {product.name}
            </h4>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {generateRecommendationExplanation(product)}
            </p>
            <Button 
              asChild 
              className="w-full bg-fashion-500 hover:bg-fashion-600 text-white font-medium"
            >
              <a 
                href={generateAmazonSearchUrl(product.searchTerm, undefined, selectedGender)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                Shop on Amazon
                <ExternalLink size={14} />
              </a>
            </Button>
          </div>
        ))}
      </div>

      {/* Mobile: stacked layout */}
      <div className="md:hidden space-y-4">
        {productSuggestions.map((product, index) => (
          <div 
            key={index} 
            className="bg-white border border-fashion-200 rounded-xl p-4 shadow-sm"
          >
            <h4 className="font-semibold text-gray-900 mb-2">
              {product.name}
            </h4>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {generateRecommendationExplanation(product)}
            </p>
            <Button 
              asChild 
              className="w-full bg-fashion-500 hover:bg-fashion-600 text-white font-medium"
            >
              <a 
                href={generateAmazonSearchUrl(product.searchTerm, undefined, selectedGender)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                Shop on Amazon
                <ExternalLink size={14} />
              </a>
            </Button>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-4 italic">
        * These are affiliate links. We may earn a commission from purchases made through these links.
      </p>
    </div>
  );
};

export default ProductRecommendationsSection;
