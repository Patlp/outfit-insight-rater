
import React from 'react';
import { Calendar } from 'lucide-react';
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
    <>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Calendar size={14} />
        {format(new Date(createdAt), 'MMM dd, yyyy')}
        {occasionContext && (
          <>
            <span>•</span>
            <span className="capitalize">{occasionContext}</span>
          </>
        )}
      </div>
      
      {feedback && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-3">
          {feedback}
        </p>
      )}
    </>
  );
};

export default WardrobeItemDetails;
