
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

  // Parse feedback into sections using the enhanced parser format
  const parseFeedbackIntoSections = (text: string) => {
    const sections = [];
    
    // Clean the text first - remove any score references or unwanted content
    const cleanedText = text
      .replace(/^(Score:|Feedback:|Rating:|Improvement:|Detailed Feedback:)\s*/gmi, '')
      .replace(/(Score:|Rating:|Improvement:|\/10|\d+\s*out of\s*10|on a scale of \d+)/gi, '')
      .trim();

    // Define section patterns that match the enhanced parser format: **Section:** content
    const sectionPatterns = [
      { 
        pattern: /\*\*Style:\*\*\s*(.*?)(?=\*\*(?:Color Coordination|Fit|Overall Impression):|$)/gis,
        title: 'Style',
        icon: Shirt,
        sentiment: 'good'
      },
      { 
        pattern: /\*\*Color Coordination:\*\*\s*(.*?)(?=\*\*(?:Style|Fit|Overall Impression):|$)/gis,
        title: 'Color Coordination',
        icon: Palette,
        sentiment: 'good'
      },
      { 
        pattern: /\*\*Fit:\*\*\s*(.*?)(?=\*\*(?:Style|Color Coordination|Overall Impression):|$)/gis,
        title: 'Fit & Silhouette',
        icon: Users,
        sentiment: 'good'
      },
      { 
        pattern: /\*\*Overall Impression:\*\*\s*(.*?)(?=\*\*(?:Style|Color Coordination|Fit):|$)/gis,
        title: 'Overall Impression',
        icon: Star,
        sentiment: 'good'
      }
    ];

    // Extract sections based on the enhanced parser format
    sectionPatterns.forEach(({ pattern, title, icon, sentiment }) => {
      const matches = [...cleanedText.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && match[1].trim().length > 10) {
          const content = match[1]
            .trim()
            .replace(/^\s*-\s*/, '')
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ');
          
          // Determine sentiment based on content keywords
          let determinedSentiment = sentiment;
          const lowerContent = content.toLowerCase();
          
          if (lowerContent.includes('excellent') || lowerContent.includes('perfect') || lowerContent.includes('outstanding')) {
            determinedSentiment = 'excellent';
          } else if (lowerContent.includes('could') || lowerContent.includes('might') || lowerContent.includes('consider') || lowerContent.includes('okay')) {
            determinedSentiment = 'okay';
          } else if (lowerContent.includes('lacks') || lowerContent.includes('needs') || lowerContent.includes('poor') || lowerContent.includes('doesn\'t work')) {
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

    // Fallback: If no structured sections found, try to parse any bold headers
    if (sections.length === 0) {
      const fallbackPatterns = [
        { pattern: /(?:^|\n)\s*\*\*([^*]+):\*\*\s*(.*?)(?=(?:\n\s*\*\*[^*]+:\*\*)|$)/gis, hasTitle: true },
        { pattern: /(?:^|\n)\s*([A-Z][a-z\s]+):\s*(.*?)(?=(?:\n\s*[A-Z][a-z\s]+:)|$)/gis, hasTitle: true }
      ];

      fallbackPatterns.forEach(({ pattern, hasTitle }) => {
        const matches = [...cleanedText.matchAll(pattern)];
        matches.forEach(match => {
          if (match[1] && match[2] && match[2].trim().length > 10) {
            const title = match[1].trim();
            const content = match[2].trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');
            
            // Map titles to appropriate icons
            let icon = Shirt;
            if (title.toLowerCase().includes('color')) icon = Palette;
            else if (title.toLowerCase().includes('fit')) icon = Users;
            else if (title.toLowerCase().includes('overall')) icon = Star;
            else icon = Layers;

            sections.push({
              title,
              content: parseMarkdownBold(content),
              icon,
              sentiment: 'good'
            });
          }
        });
      });
    }

    // Final fallback: Create a single general section if no structured content found
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
