import React, { useState } from 'react';
import { useRating } from '@/context/RatingContext';
import { Star, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';

const RatingDisplay: React.FC = () => {
  const { ratingResult } = useRating();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  if (!ratingResult) return null;
  
  const { score, feedback, suggestions } = ratingResult;
  
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Parse markdown bold syntax (**text**) to HTML
  const parseMarkdownBold = (text: string) => {
    if (!text) return '';
    
    // Replace **text** with <strong>text</strong>
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };
  
  // Format feedback into clean sections with clear headings
  const formatFeedbackSections = (text: string) => {
    if (!text) return [];
    
    // Define common fashion feedback section identifiers
    const sectionIdentifiers = [
      'Style:', 'Color Coordination:', 'Fit:', 'Overall Impression:',
      'Style', 'Color Coordination', 'Fit', 'Overall Impression',
      'Detailed Feedback:', 'Pattern:', 'Accessories:', 'Proportions:',
      'Layering:', 'Color:', 'Patterns:', 'Silhouette:'
    ];
    
    let formattedText = text;
    
    // Remove all numbered list indicators and formatting artifacts
    formattedText = formattedText.replace(/^\d+\.\s*/gm, '');
    formattedText = formattedText.replace(/^\(\d+\)\s*\*\*/gm, '');
    
    // Remove metadata and scoring info
    formattedText = formattedText.replace(/(Score:|Rating:|Improvement:|\/10|\d+\s*out of\s*10|on a scale of \d+)/gi, '');
    
    // Remove standalone headings when they're not part of a section
    formattedText = formattedText.replace(/^(Style|Improvement|Feedback|Score)$/gmi, '');
    
    // Replace section identifiers with HTML heading elements
    sectionIdentifiers.forEach(identifier => {
      const regex = new RegExp(`(- ${identifier}|${identifier})\\s`, 'g');
      formattedText = formattedText.replace(regex, `<h4 class="text-fashion-600 font-semibold mt-4 mb-2">${identifier}</h4>`);
    });
    
    // Split into paragraphs and create formatted HTML
    const paragraphs = formattedText
      .split(/\n+/)
      .filter(p => p.trim().length > 0)
      .map(p => {
        // If the paragraph doesn't start with an h4 tag, wrap it in a p tag
        if (!p.startsWith('<h4')) {
          return `<p class="mb-3 text-gray-700">${p}</p>`;
        }
        return p;
      });
    
    return paragraphs;
  };
  
  // Format style suggestions with clean heading styling
  const formatSuggestion = (suggestion: string) => {
    if (!suggestion || suggestion.trim().length < 5) return null;
    
    // Clean up the suggestion text
    let cleanSuggestion = suggestion
      .replace(/^(\d+\.\s*|\-\s*|\*\s*)/, '') // Remove list markers
      .replace(/^\s*\*\*/g, '') // Remove starting asterisks
      .trim();
    
    // Look for category patterns like "**Accessories:**" or "Footwear:"
    const headingPattern = /^(.*?):\s*(.*)/;
    const match = cleanSuggestion.match(headingPattern);
    
    if (match && match[1] && match[2]) {
      const heading = match[1].replace(/\*\*/g, '').trim();
      const content = match[2].trim();
      
      if (heading && content) {
        return (
          <>
            <span className="font-semibold text-fashion-600">{heading}:</span>{' '}
            <span dangerouslySetInnerHTML={{ __html: parseMarkdownBold(content) }} />
          </>
        );
      }
    }
    
    // If no pattern match, just return the cleaned suggestion
    return <span dangerouslySetInnerHTML={{ __html: parseMarkdownBold(cleanSuggestion) }} />;
  };

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    
    try {
      // Prepare the data to send
      const emailData = {
        email,
        subject: `Your Fashion Rating: ${score}/10`,
        score,
        feedback,
        suggestions
      };
      
      const { data, error } = await fetch('https://frfvrgarcwmpviimsenu.supabase.co/functions/v1/send-rating-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      }).then(res => res.json());
      
      if (error) {
        throw new Error(error.message || 'Failed to send email');
      }
      
      toast.success('Rating results sent to your email!');
      setShowEmailDialog(false);
      setEmail('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };
  
  // Filter out empty or problematic suggestions
  const validSuggestions = suggestions ? suggestions
    .filter(suggestion => 
      suggestion && 
      suggestion.trim().length > 5 && 
      !suggestion.match(/^\s*\*\*\s*$/)) : [];
  
  const feedbackSections = formatFeedbackSections(feedback);
  
  return (
    <div className="animate-fade-in max-w-md w-full mx-auto mt-8 fashion-card">
      <div className="flex flex-col items-center mb-6">
        <h3 className="text-xl font-semibold mb-2 text-fashion-600">Your Style Score</h3>
        
        <div className="flex items-center justify-center gap-1">
          <span className={`text-4xl font-bold ${getScoreColor()}`}>{score}</span>
          <span className="text-xl font-medium text-gray-400">/10</span>
        </div>
        
        <div className="flex mt-2">
          {[...Array(10)].map((_, i) => (
            <Star
              key={i}
              size={20}
              className={`${
                i < score
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-fashion-600 border-b border-fashion-200 pb-2">Detailed Feedback</h3>
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
      
      {validSuggestions && validSuggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-fashion-600 border-b border-fashion-200 pb-2">Style Suggestions</h3>
          <ul className="space-y-3 mt-4">
            {validSuggestions.map((suggestion, index) => {
              const formattedSuggestion = formatSuggestion(suggestion);
              return formattedSuggestion ? (
                <li key={index} className="flex items-start gap-2">
                  <div className="min-w-5 mt-1">
                    <div className="w-3 h-3 rounded-full bg-fashion-500"></div>
                  </div>
                  <p className="text-gray-700">
                    {formattedSuggestion}
                  </p>
                </li>
              ) : null;
            })}
          </ul>
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t border-fashion-200">
        <p className="text-sm text-gray-500 italic mb-4">
          Remember, fashion is subjective and these suggestions are just guidelines!
        </p>
        
        <Button 
          onClick={() => setShowEmailDialog(true)} 
          className="w-full flex items-center justify-center gap-2 bg-fashion-500 hover:bg-fashion-600 text-white"
        >
          <Mail size={16} />
          Send My Results to Email
        </Button>
      </div>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Mail className="h-5 w-5 text-fashion-500" />
              Send Your Results
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Enter your email address to receive your style rating and personalized suggestions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground italic mt-1">
                (If you don't see the email shortly, please check your spam or junk folder)
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleSendEmail} 
                disabled={isSending}
                className="bg-fashion-500 hover:bg-fashion-600 text-white"
              >
                {isSending ? 'Sending...' : (
                  <>
                    <Send size={16} className="mr-2" />
                    Send Results
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RatingDisplay;
