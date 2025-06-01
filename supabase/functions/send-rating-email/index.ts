
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RatingEmailRequest {
  email: string;
  subject: string;
  score: number;
  feedback: string;
  suggestions: string[];
}

function formatFeedback(feedback: string): string {
  if (!feedback) return '';

  // Format the feedback to be more email-friendly
  let formattedText = feedback
    .replace(/^\d+\.\s*/gm, '')
    .replace(/^\(\d+\)\s*\*\*/gm, '')
    .replace(/(Score:|Rating:|Improvement:|\/10|\d+\s*out of\s*10|on a scale of \d+)/gi, '');
    
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
        icon: '👔',
        sentiment: 'good'
      },
      { 
        pattern: /\*\*Color Coordination:\*\*\s*(.*?)(?=\*\*(?:Style|Fit|Overall Impression):|$)/gis,
        title: 'Color Coordination',
        icon: '🎨',
        sentiment: 'good'
      },
      { 
        pattern: /\*\*Fit:\*\*\s*(.*?)(?=\*\*(?:Style|Color Coordination|Overall Impression):|$)/gis,
        title: 'Fit & Silhouette',
        icon: '👥',
        sentiment: 'good'
      },
      { 
        pattern: /\*\*Overall Impression:\*\*\s*(.*?)(?=\*\*(?:Style|Color Coordination|Fit):|$)/gis,
        title: 'Overall Impression',
        icon: '⭐',
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
            content: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
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
            let icon = '👔';
            if (title.toLowerCase().includes('color')) icon = '🎨';
            else if (title.toLowerCase().includes('fit')) icon = '👥';
            else if (title.toLowerCase().includes('overall')) icon = '⭐';

            sections.push({
              title,
              content: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
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
        content: cleanedText.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
        icon: '👔',
        sentiment: 'good'
      });
    }

    return sections;
  };

  const feedbackSections = parseFeedbackIntoSections(formattedText);
  
  return feedbackSections.map(section => {
    const sentimentBadge = getSentimentBadge(section.sentiment);
    return `
      <div style="background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #f3f4f6; padding: 16px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 16px;">${section.icon}</span>
            <h4 style="font-weight: 600; color: #111827; margin: 0; font-size: 16px;">${section.title}</h4>
          </div>
          ${sentimentBadge}
        </div>
        <div style="color: #374151; line-height: 1.6; font-size: 14px;">
          ${section.content}
        </div>
      </div>
    `;
  }).join('');
}

function getSentimentBadge(sentiment: string): string {
  switch (sentiment) {
    case 'excellent':
      return '<span style="display: inline-flex; align-items: center; padding: 2px 8px; font-size: 12px; font-weight: 600; border-radius: 9999px; background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;">Excellent</span>';
    case 'good':
      return '<span style="display: inline-flex; align-items: center; padding: 2px 8px; font-size: 12px; font-weight: 600; border-radius: 9999px; background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;">Good</span>';
    case 'okay':
      return '<span style="display: inline-flex; align-items: center; padding: 2px 8px; font-size: 12px; font-weight: 600; border-radius: 9999px; background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;">Okay</span>';
    case 'needs-improvement':
      return '<span style="display: inline-flex; align-items: center; padding: 2px 8px; font-size: 12px; font-weight: 600; border-radius: 9999px; background-color: #fee2e2; color: #dc2626; border: 1px solid #fecaca;">Needs Work</span>';
    default:
      return '<span style="display: inline-flex; align-items: center; padding: 2px 8px; font-size: 12px; font-weight: 600; border-radius: 9999px; background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;">Good</span>';
  }
}

function formatSuggestions(suggestions: string[]): string {
  if (!suggestions || suggestions.length === 0) return '';
  
  const validSuggestions = suggestions
    .filter(suggestion => suggestion && suggestion.trim().length > 5)
    .map(suggestion => {
      // Clean up the suggestion text
      let cleaned = suggestion
        .replace(/^(\d+\.\s*|\-\s*|\*\s*)/, '')
        .replace(/^\s*\*\*/g, '')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .trim();
      
      // Look for category patterns like "Accessories: suggestion text"
      const headingPattern = /^([^:]+):\s*(.+)/;
      const match = cleaned.match(headingPattern);
      
      if (match && match[1] && match[2]) {
        const heading = match[1].replace(/\*\*/g, '').trim();
        const content = match[2].trim();
        
        if (heading && content) {
          return `<span style="font-weight: 600; color: #7c3aed;">${heading}:</span> <span>${content}</span>`;
        }
      }
      
      return cleaned;
    });
    
  return validSuggestions.map(suggestion => `
    <li style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px;">
      <div style="min-width: 12px; margin-top: 6px;">
        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #7c3aed;"></div>
      </div>
      <span style="color: #374151; line-height: 1.6;">${suggestion}</span>
    </li>
  `).join('');
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, subject, score, feedback, suggestions }: RatingEmailRequest = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: "Valid email address is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client for logging
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log the email to our database
    const { error: logError } = await supabase
      .from('email_records')
      .insert({
        email: email,
        source: 'results'
      });
    
    if (logError) {
      console.error(`Failed to log email ${email}:`, logError);
    }

    // Determine color based on score
    const scoreColor = score >= 8 ? '#22c55e' : score >= 6 ? '#eab308' : '#ef4444';
    
    const formattedFeedback = formatFeedback(feedback);
    const formattedSuggestions = formatSuggestions(suggestions);

    const emailResponse = await resend.emails.send({
      from: "RateMyFit <onboarding@resend.dev>",
      to: [email],
      subject: `Your Style Rating: ${score}/10`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Style Rating</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fdfcf8; line-height: 1.6;">
          <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #fdfcf8; padding: 20px;">
            
            <!-- Logo Section -->
            <div style="text-align: center; margin: 20px 0 40px 0;">
              <img src="https://ratemyfit.lovable.app/lovable-uploads/3c887a45-fcd4-4fa5-8558-f2c9bbe856f9.png" 
                   alt="RateMyFit Logo" 
                   style="max-width: 180px; height: auto; display: block; margin: 0 auto;" />
            </div>

            <!-- Main Card Container -->
            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); border: 1px solid #d1d5db; padding: 24px; margin-bottom: 20px;">
              
              <!-- Score Display -->
              <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #7c3aed; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">Your Style Score</h2>
                
                <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 8px;">
                  <span style="font-size: 36px; font-weight: bold; color: ${scoreColor};">${score}</span>
                  <span style="font-size: 20px; font-weight: 500; color: #9ca3af;">/10</span>
                </div>
                
                <!-- Star Rating -->
                <div style="display: flex; justify-content: center; gap: 2px;">
                  ${Array.from({length: 10}, (_, i) => 
                    `<span style="color: ${i < score ? '#fbbf24' : '#d1d5db'}; font-size: 16px;">★</span>`
                  ).join('')}
                </div>
              </div>
              
              <!-- Detailed Feedback Section -->
              ${formattedFeedback ? `
              <div style="margin-bottom: 24px;">
                <h3 style="color: #7c3aed; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Detailed Feedback</h3>
                ${formattedFeedback}
              </div>
              ` : ''}
              
              <!-- Style Suggestions Section -->
              ${formattedSuggestions ? `
              <div style="margin-bottom: 24px;">
                <h3 style="color: #7c3aed; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #d1d5db;">Style Suggestions</h3>
                <ul style="list-style: none; padding: 0; margin: 16px 0 0 0;">
                  ${formattedSuggestions}
                </ul>
              </div>
              ` : ''}
              
              <!-- Footer Message -->
              <div style="text-align: center; padding-top: 20px; border-top: 1px solid #d1d5db;">
                <p style="font-size: 14px; color: #6b7280; font-style: italic; margin: 0;">
                  Remember, fashion is subjective and these suggestions are just guidelines!
                </p>
              </div>
            </div>
            
            <!-- Email Footer -->
            <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 30px;">
              <p style="margin: 0 0 8px 0;">
                <strong style="color: #333;">www.ratemyfit.app</strong>
              </p>
              <p style="margin: 0;">© ${new Date().getFullYear()} RateMyFit</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-rating-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
