
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    
  // Add some basic HTML formatting
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  return formattedText;
}

function formatSuggestions(suggestions: string[]): string {
  if (!suggestions || suggestions.length === 0) return '';
  
  const validSuggestions = suggestions
    .filter(suggestion => suggestion && suggestion.trim().length > 5)
    .map(suggestion => {
      // Clean up the suggestion text
      return suggestion
        .replace(/^(\d+\.\s*|\-\s*|\*\s*)/, '')
        .replace(/^\s*\*\*/g, '')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .trim();
    });
    
  return validSuggestions.map(suggestion => `<li>${suggestion}</li>`).join('');
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

    // Determine color based on score
    const scoreColor = score >= 8 ? '#22c55e' : score >= 6 ? '#eab308' : '#ef4444';
    
    const formattedFeedback = formatFeedback(feedback);
    const formattedSuggestions = formatSuggestions(suggestions);

    const emailResponse = await resend.emails.send({
      from: "RateMyFit <onboarding@resend.dev>",
      to: [email],
      subject: `Your Style Rating: ${score}/10`,
      html: `
        <div style="font-family: 'Helvetica', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="text-align: center; color: #333333;">
            <strong>www.ratemyfit.app</strong>
          </h1>
          <h2 style="text-align: center; color: #333333;">Your Style Rating</h2>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 42px; font-weight: bold; color: ${scoreColor};">${score}<span style="font-size: 24px; color: #999;">/10</span></div>
          </div>
          
          <div style="margin: 30px 0; border-top: 1px solid #eee; padding-top: 20px;">
            <h2 style="color: #333333; font-size: 20px; margin-bottom: 15px;">Detailed Feedback</h2>
            <div style="color: #444; line-height: 1.6;">
              ${formattedFeedback}
            </div>
          </div>
          
          ${formattedSuggestions ? `
          <div style="margin: 30px 0; border-top: 1px solid #eee; padding-top: 20px;">
            <h2 style="color: #333333; font-size: 20px; margin-bottom: 15px;">Style Suggestions</h2>
            <ul style="color: #444; line-height: 1.6;">
              ${formattedSuggestions}
            </ul>
          </div>
          ` : ''}
          
          <div style="margin-top: 40px; text-align: center; font-size: 14px; color: #999; border-top: 1px solid #eee; padding-top: 20px;">
            <p>Remember, fashion is subjective and these suggestions are just guidelines!</p>
            <p>© ${new Date().getFullYear()} RateMyFit</p>
          </div>
        </div>
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
