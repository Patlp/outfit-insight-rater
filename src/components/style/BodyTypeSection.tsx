import React from 'react';
import { BodyType } from '@/context/RatingContext';

interface BodyTypeSectionProps {
  bodyType: BodyType;
}

const BodyTypeSection: React.FC<BodyTypeSectionProps> = ({ bodyType }) => {
  // Simple shape visualization based on the visual shape
  const renderShape = (shape: string) => {
    const baseClasses = "w-20 h-20 mx-auto mb-4 border-2 border-fashion-400 bg-fashion-100";
    
    switch (shape.toLowerCase()) {
      case 'rectangle':
        return <div className={`${baseClasses} rounded-sm`}></div>;
      case 'hourglass':
        return (
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-fashion-100 border-2 border-fashion-400" 
                 style={{ clipPath: 'polygon(30% 0%, 70% 0%, 90% 50%, 70% 100%, 30% 100%, 10% 50%)' }}>
            </div>
          </div>
        );
      case 'inverted triangle':
      case 'triangle':
        return (
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-fashion-100 border-2 border-fashion-400" 
                 style={{ clipPath: shape.toLowerCase().includes('inverted') 
                   ? 'polygon(20% 0%, 80% 0%, 50% 100%)' 
                   : 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
            </div>
          </div>
        );
      case 'round':
      case 'oval':
        return <div className={`${baseClasses} rounded-full`}></div>;
      case 'diamond':
        return (
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-fashion-100 border-2 border-fashion-400 transform rotate-45 rounded-sm">
            </div>
          </div>
        );
      default:
        return <div className={`${baseClasses} rounded-lg`}></div>;
    }
  };

  return (
    <div className="fashion-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-fashion-900">Body Type</h3>
      </div>
      
      <div className="text-center mb-6">
        <h4 className="text-xl font-bold text-fashion-800 mb-2">Your Body Type: {bodyType.type}</h4>
        {renderShape(bodyType.visualShape)}
        <p className="text-sm text-fashion-700 leading-relaxed">
          {bodyType.description}
        </p>
      </div>

      <div>
        <h5 className="text-sm font-medium text-fashion-800 mb-3">Styling Recommendations</h5>
        <ul className="space-y-2">
          {bodyType.stylingRecommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-fashion-500 mt-2 flex-shrink-0"></div>
              <span className="text-sm text-fashion-700">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BodyTypeSection;