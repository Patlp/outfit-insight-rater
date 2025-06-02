
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
  const productSuggestions = parseProductSuggestions(feedback, suggestions, selectedGender);

  if (!productSuggestions || productSuggestions.length === 0) {
    return null;
  }

  const getOrdinalNumber = (index: number): string => {
    switch (index) {
      case 0: return '1st';
      case 1: return '2nd';
      case 2: return '3rd';
      default: return `${index + 1}th`;
    }
  };

  const generateRecommendationExplanation = (product: any, feedback: string, suggestions: string[]): string => {
    const combinedText = `${feedback} ${suggestions.join(' ')}`.toLowerCase();
    
    // Extract context clues about why this item was suggested
    const productLower = product.name.toLowerCase();
    
    // Look for specific style improvements mentioned in the feedback
    if (combinedText.includes('color') && (productLower.includes('belt') || productLower.includes('accessory'))) {
      return "This accessory will help tie your color palette together and create a more cohesive, polished appearance.";
    }
    
    if (combinedText.includes('professional') || combinedText.includes('work')) {
      return "This piece will elevate your look to be more appropriate for professional settings while maintaining style.";
    }
    
    if (combinedText.includes('casual') && productLower.includes('sneaker')) {
      return "These will provide the perfect casual foundation while keeping your outfit looking intentional and put-together.";
    }
    
    if (combinedText.includes('fit') || combinedText.includes('silhouette')) {
      return "This item will help improve your overall silhouette and create a more flattering, well-proportioned look.";
    }
    
    if (combinedText.includes('layer') || productLower.includes('blazer') || productLower.includes('jacket')) {
      return "Adding this layer will create structure and sophistication while giving you versatile styling options.";
    }
    
    if (productLower.includes('dress') && combinedText.includes('occasion')) {
      return "This dress style will be perfect for the occasion while ensuring you look appropriately dressed and confident.";
    }
    
    if (productLower.includes('shoe') || productLower.includes('heel') || productLower.includes('boot')) {
      return "The right footwear can completely transform your look and provide the perfect foundation for your outfit.";
    }
    
    // Default explanations based on product category
    switch (product.category) {
      case 'accessories':
        return "This accessory will add the perfect finishing touch and help complete your overall look with style.";
      case 'footwear':
        return "These shoes will provide a strong foundation for your outfit and enhance your overall style presentation.";
      case 'outerwear':
        return "This piece will add structure and polish while giving you versatile layering options for different occasions.";
      case 'tops':
        return "This top will create a strong foundation for your look while ensuring you appear polished and put-together.";
      case 'bottoms':
        return "These will provide the perfect base for your outfit while ensuring a flattering and well-proportioned silhouette.";
      case 'dresses':
        return "This dress will make getting dressed effortless while ensuring you look appropriately styled for any occasion.";
      default:
        return "This piece will complement your personal style perfectly and help elevate your overall appearance.";
    }
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
              {getOrdinalNumber(index)} Recommendation: {product.name}
            </h4>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {generateRecommendationExplanation(product, feedback, suggestions)}
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
              {getOrdinalNumber(index)} Recommendation: {product.name}
            </h4>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {generateRecommendationExplanation(product, feedback, suggestions)}
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
