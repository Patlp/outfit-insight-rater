
import React from 'react';
import { formatFeedbackSections, parseMarkdownBold } from '@/utils/textFormatting';

interface FeedbackSectionProps {
  feedback: string;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ feedback }) => {
  const feedbackSections = formatFeedbackSections(feedback);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-fashion-600 border-b border-fashion-200 pb-2">
        Detailed Feedback
      </h3>
      <div className="space-y-1">
        {feedbackSections.map((section, index) => (
          <div 
            key={index}
            className="feedback-section"
            dangerouslySetInnerHTML={{ __html: parseMarkdownBold(section) }}
          />
        ))}
      </div>
    </div>
  );
};

export default FeedbackSection;
