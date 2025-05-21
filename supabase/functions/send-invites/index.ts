
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    
    // In a real implementation, you would send emails here using a service like Resend
    // For now, we'll just log and simulate success
    
    // Example of what the email sending code might look like:
    /*
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    for (const email of emails) {
      await resend.emails.send({
        from: "RateMyFit <noreply@ratemyfit.app>",
        to: [email],
        subject: "Your friend invited you to RateMyFit!",
        html: `
          <h1>You've been invited to RateMyFit!</h1>
          <p>Your friend just got roasted by AI on RateMyFit and thought you'd want in.</p>
          <p>Click here to upload your fit and try it — if you beat their score, you get Meme Mode too!</p>
          <a href="https://ratemyfit.app" style="background-color: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Try RateMyFit Now</a>
        `,
      });
    }
    */
    
    // For now, just simulate success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully sent ${emails.length} invite(s)` 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error("Error processing invite requests:", error);
    
    return new Response(
      JSON.stringify({ error: "Failed to process invite requests" }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
