import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const { sessionId } = await req.json();
    if (!sessionId) {
      // If no session ID provided, this might be a direct payment link flow
      // Return that verification is not possible without session ID
      logStep("No session ID provided - cannot verify direct payment link");
      return new Response(JSON.stringify({ 
        valid: false,
        error: "Session ID required for payment verification",
        directPayment: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    logStep("Session ID provided", { sessionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      logStep("Retrieved session", { 
        id: session.id, 
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
        mode: session.mode
      });

      // Accept both subscription and one-time payments
      const isValid = session.payment_status === 'paid' && 
                     (session.mode === 'subscription' || session.mode === 'payment');
      
      return new Response(JSON.stringify({ 
        valid: isValid,
        email: session.customer_email,
        sessionId: session.id,
        mode: session.mode
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (stripeError) {
      logStep("Stripe session retrieval failed", { error: stripeError.message });
      return new Response(JSON.stringify({ 
        valid: false,
        error: "Invalid session ID",
        sessionId 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, valid: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});