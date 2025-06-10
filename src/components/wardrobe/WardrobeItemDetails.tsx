
import React, { useState } from 'react';
import { Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import FeedbackSection from '@/components/rating/FeedbackSection';

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
  const [isOpen, setIsOpen] = useState(false);

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
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto font-medium text-left hover:bg-transparent"
            >
              <span className="text-lg font-semibold text-fashion-600">
                Detailed Feedback
              </span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0">
            <div className="pt-2">
              <FeedbackSection feedback={feedback} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default WardrobeItemDetails;
