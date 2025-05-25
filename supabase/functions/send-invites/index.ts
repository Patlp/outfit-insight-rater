
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emails } = await req.json();
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid emails provided" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
    console.log(`Processing invite requests for ${emails.length} email(s)`);
    
    // Initialize Supabase client for logging
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Initialize the Resend client with your API key
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const sentEmails = [];
    const failedEmails = [];
    
    // Send emails to each recipient
    for (const email of emails) {
      try {
        // Log the email to our database first
        const { error: logError } = await supabase
          .from('email_records')
          .insert({
            email: email,
            source: 'invite'
          });
        
        if (logError) {
          console.error(`Failed to log email ${email}:`, logError);
        }
        
        const { data, error } = await resend.emails.send({
          from: "RateMyFit <invites@ratemyfit.app>",
          to: [email],
          subject: "Your friend invited you to RateMyFit!",
          html: `
            <h1>You've been invited to RateMyFit!</h1>
            <p>Your friend just got roasted by AI on RateMyFit and thought you'd want in.</p>
            <p>Click here to upload your fit and try it — if you beat their score, you get Roast Mode too!</p>
            <a href="https://ratemyfit.app" style="background-color: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Try RateMyFit Now</a>
          `,
        });
        
        if (error) {
          console.error(`Failed to send email to ${email}:`, error);
          failedEmails.push({ email, error: error.message });
        } else {
          console.log(`Successfully sent email to ${email}`);
          sentEmails.push(email);
        }
      } catch (emailError) {
        console.error(`Exception sending email to ${email}:`, emailError);
        failedEmails.push({ email, error: emailError.message });
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully sent ${sentEmails.length} invite(s)`,
        sentEmails,
        failedEmails
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error("Error processing invite requests:", error);
    
    return new Response(
      JSON.stringify({ error: "Failed to process invite requests", details: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
