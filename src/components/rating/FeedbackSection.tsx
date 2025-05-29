
import React from 'react';
import { Shirt, Palette, Users, Star, Layers } from 'lucide-react';
import FeedbackCard from './FeedbackCard';
import { parseMarkdownBold } from '@/utils/textFormatting';

interface FeedbackSectionProps {
  feedback: string;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ feedback }) => {
  if (!feedback || feedback.trim().length === 0) {
    return null;
  }

  // Parse feedback into sections
  const parseFeedbackIntoSections = (text: string) => {
    const sections = [];
    const cleanedText = text
      .replace(/^(Score:|Feedback:|Rating:|Improvement:|Detailed Feedback:)\s*/gmi, '')
      .replace(/(Score:|Rating:|Improvement:|\/10|\d+\s*out of\s*10|on a scale of \d+)/gi, '');

    // Define section patterns and their corresponding icons
    const sectionPatterns = [
      { 
        pattern: /(?:^|\n)\s*-?\s*(?:\*\*)?Style(?:\*\*)?:?\s*(.*?)(?=(?:\n\s*-?\s*(?:\*\*)?(?:Color|Fit|Overall|Pattern|Accessories|Proportions|Layering|Silhouette))|$)/gis,
        title: 'Style',
        icon: Shirt,
        sentiment: 'good'
      },
      { 
        pattern: /(?:^|\n)\s*-?\s*(?:\*\*)?(?:Color Coordination|Color)(?:\*\*)?:?\s*(.*?)(?=(?:\n\s*-?\s*(?:\*\*)?(?:Style|Fit|Overall|Pattern|Accessories|Proportions|Layering|Silhouette))|$)/gis,
        title: 'Color Coordination',
        icon: Palette,
        sentiment: 'good'
      },
      { 
        pattern: /(?:^|\n)\s*-?\s*(?:\*\*)?Fit(?:\*\*)?:?\s*(.*?)(?=(?:\n\s*-?\s*(?:\*\*)?(?:Style|Color|Overall|Pattern|Accessories|Proportions|Layering|Silhouette))|$)/gis,
        title: 'Fit & Silhouette',
        icon: Users,
        sentiment: 'good'
      },
      { 
        pattern: /(?:^|\n)\s*-?\s*(?:\*\*)?(?:Overall Impression|Overall)(?:\*\*)?:?\s*(.*?)(?=(?:\n\s*-?\s*(?:\*\*)?(?:Style|Color|Fit|Pattern|Accessories|Proportions|Layering|Silhouette))|$)/gis,
        title: 'Overall Impression',
        icon: Star,
        sentiment: 'good'
      },
      { 
        pattern: /(?:^|\n)\s*-?\s*(?:\*\*)?(?:Pattern|Accessories|Proportions|Layering|Silhouette)(?:\*\*)?:?\s*(.*?)(?=(?:\n\s*-?\s*(?:\*\*)?(?:Style|Color|Fit|Overall))|$)/gis,
        title: 'Additional Details',
        icon: Layers,
        sentiment: 'good'
      }
    ];

    sectionPatterns.forEach(({ pattern, title, icon, sentiment }) => {
      const matches = [...cleanedText.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && match[1].trim().length > 10) {
          const content = match[1]
            .trim()
            .replace(/^\s*-\s*/, '')
            .replace(/\*\*/g, '');
          
          // Determine sentiment based on content
          let determinedSentiment = sentiment;
          if (content.toLowerCase().includes('excellent') || content.toLowerCase().includes('perfect')) {
            determinedSentiment = 'excellent';
          } else if (content.toLowerCase().includes('could') || content.toLowerCase().includes('might') || content.toLowerCase().includes('consider')) {
            determinedSentiment = 'okay';
          } else if (content.toLowerCase().includes('lacks') || content.toLowerCase().includes('needs')) {
            determinedSentiment = 'needs-improvement';
          }

          sections.push({
            title,
            content: parseMarkdownBold(content),
            icon,
            sentiment: determinedSentiment
          });
        }
      });
    });

    // If no sections found, create a general feedback section
    if (sections.length === 0 && cleanedText.trim().length > 0) {
      sections.push({
        title: 'Style Analysis',
        content: parseMarkdownBold(cleanedText.trim()),
        icon: Shirt,
        sentiment: 'good'
      });
    }

    return sections;
  };

  const feedbackSections = parseFeedbackIntoSections(feedback);

  if (!feedbackSections || feedbackSections.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4 text-fashion-600">
        Detailed Feedback
      </h3>
      <div className="space-y-3">
        {feedbackSections.map((section, index) => (
          <FeedbackCard
            key={index}
            title={section.title}
            content={section.content}
            icon={section.icon}
            sentiment={section.sentiment}
          />
        ))}
      </div>
    </div>
  );
};

export default FeedbackSection;
