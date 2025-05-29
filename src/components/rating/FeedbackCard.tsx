
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface FeedbackCardProps {
  title: string;
  content: string;
  icon: LucideIcon;
  sentiment?: 'excellent' | 'good' | 'okay' | 'needs-improvement';
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ title, content, icon: Icon, sentiment = 'good' }) => {
  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Good</Badge>;
      case 'okay':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Okay</Badge>;
      case 'needs-improvement':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Needs Work</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-700 border-green-200">Good</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Icon className="w-5 h-5 text-gray-600" />
          </div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        {getSentimentBadge(sentiment)}
      </div>
      <div className="text-gray-700 leading-relaxed">
        <p dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
};

export default FeedbackCard;
