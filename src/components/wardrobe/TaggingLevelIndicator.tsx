
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Star, 
  Sparkles, 
  Tag,
  CheckCircle,
  Database,
  Brain,
  Layers
} from 'lucide-react';

interface TaggingLevelIndicatorProps {
  level: 'basic' | 'medium' | 'advanced';
  itemCount: number;
  averageConfidence?: number;
  className?: string;
}

const TaggingLevelIndicator: React.FC<TaggingLevelIndicatorProps> = ({
  level,
  itemCount,
  averageConfidence,
  className = ''
}) => {
  const getLevelInfo = () => {
    switch (level) {
      case 'basic':
        return {
          icon: <Tag size={12} className="text-gray-500" />,
          label: 'Basic Tags',
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          description: 'Rule-based extraction'
        };
      case 'medium':
        return {
          icon: <CheckCircle size={12} className="text-blue-500" />,
          label: 'AI Tags',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          description: 'AI-powered extraction'
        };
      case 'advanced':
        return {
          icon: <Brain size={12} className="text-purple-500" />,
          label: 'Multi-Dataset',
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          description: 'Structured format: Colour + Item + Material + Pattern'
        };
      default:
        return {
          icon: <Tag size={12} className="text-gray-500" />,
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          description: 'Unknown tagging level'
        };
    }
  };

  const levelInfo = getLevelInfo();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant="outline" 
        className={`${levelInfo.color} flex items-center gap-1`}
        title={`${levelInfo.description} - ${itemCount} items found${averageConfidence ? ` (${Math.round(averageConfidence * 100)}% avg confidence)` : ''}`}
      >
        {levelInfo.icon}
        <span className="text-xs font-medium">{levelInfo.label}</span>
      </Badge>
      
      {level === 'advanced' && (
        <>
          <Badge variant="outline" className="text-xs px-1 py-0 bg-purple-50 text-purple-600 border-purple-200">
            <Database size={10} className="mr-1" />
            Kaggle
          </Badge>
          <Badge variant="outline" className="text-xs px-1 py-0 bg-purple-50 text-purple-600 border-purple-200">
            <Layers size={10} className="mr-1" />
            Fashionpedia
          </Badge>
        </>
      )}
      
      <span className="text-xs text-gray-500">
        {itemCount} item{itemCount !== 1 ? 's' : ''}
      </span>
      
      {averageConfidence && (
        <span className="text-xs text-gray-500">
          {Math.round(averageConfidence * 100)}%
        </span>
      )}
    </div>
  );
};

export default TaggingLevelIndicator;
