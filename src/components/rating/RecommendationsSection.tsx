
import React from 'react';
import { Product } from '@/types/product';
import { ExternalLink, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecommendationsSectionProps {
  recommendations?: Product[];
}

const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ recommendations }) => {
  // Static product for now as requested
  const staticProduct: Product = {
    id: "1",
    name: "Premium Fashion Item",
    description: "Upgrade your style with this carefully selected piece that matches your aesthetic.",
    price: "$29.99",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop",
    affiliateUrl: "https://sovrn.co/1oztrlh",
    brand: "StyleCo",
    category: "Fashion"
  };

  const productsToShow = recommendations && recommendations.length > 0 ? recommendations : [staticProduct];

  if (!productsToShow || productsToShow.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-fashion-600 border-b border-fashion-200 pb-2 flex items-center gap-2">
        <ShoppingBag size={20} />
        Recommended Products
      </h3>
      <div className="grid gap-4">
        {productsToShow.map((product) => (
          <div key={product.id} className="bg-white border border-fashion-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                {product.brand && (
                  <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
                )}
                <p className="text-sm text-gray-700 mb-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-fashion-600">{product.price}</span>
                  <Button 
                    asChild 
                    size="sm"
                    className="bg-fashion-500 hover:bg-fashion-600 text-white"
                  >
                    <a 
                      href={product.affiliateUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink size={14} />
                      Shop Now
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3 italic">
        * These are affiliate links. We may earn a commission from purchases made through these links.
      </p>
    </div>
  );
};

export default RecommendationsSection;
