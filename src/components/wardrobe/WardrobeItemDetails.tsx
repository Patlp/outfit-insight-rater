
import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface WardrobeItemDetailsProps {
  createdAt: string;
  occasionContext?: string | null;
  feedback?: string | null;
}

const WardrobeItemDetails: React.FC<WardrobeItemDetailsProps> = ({
  createdAt,
  occasionContext,
  feedback
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>{format(new Date(createdAt), 'MMM dd, yyyy')}</span>
        </div>
        {occasionContext && (
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span className="capitalize bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
              {occasionContext}
            </span>
          </div>
        )}
      </div>
      
      {feedback && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-2">Fashion Feedback</h4>
          <p className="text-gray-700 leading-relaxed text-sm">
            {feedback}
          </p>
        </div>
      )}
    </div>
  );
};

export default WardrobeItemDetails;
