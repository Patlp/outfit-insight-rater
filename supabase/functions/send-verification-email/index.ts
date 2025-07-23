import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    console.log('Webhook received for verification email:', { 
      payload: payload.substring(0, 500),
      headers: headers,
      hookSecret: hookSecret ? 'Present' : 'Missing'
    })
    
    // Check if we have the hook secret
    if (!hookSecret) {
      console.error('SEND_EMAIL_HOOK_SECRET not found')
      return new Response(JSON.stringify({ error: 'Hook secret not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }
    
    const wh = new Webhook(hookSecret)
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
      }
    }

    // Create the verification link
    const verificationUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`

    // Create beautiful RateMyFit branded email
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to RateMyFit!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Logo Section -->
        <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://ratemyfit.lovable.app/lovable-uploads/3c887a45-fcd4-4fa5-8558-f2c9bbe856f9.png" 
                 alt="RateMyFit Logo" 
                 style="max-width: 200px; height: auto;">
        </div>

        <!-- Main Content -->
        <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <h1 style="color: #1a1a1a; font-size: 28px; font-weight: bold; margin: 0 0 24px 0; text-align: center;">
                Welcome to RateMyFit! 👗
            </h1>
            
            <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 16px 0;">
                Thank you for signing up! We're excited to help you elevate your style with AI-powered fashion feedback.
            </p>
            
            <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 16px 0;">
                Click the button below to verify your email and start getting instant outfit ratings:
            </p>
            
            <!-- Verification Button -->
            <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #8B5CF6; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Verify Email & Get Started
                </a>
            </div>
            
            <p style="color: #4a4a4a; font-size: 14px; line-height: 20px; margin: 24px 0 8px 0;">
                Once verified, you'll be able to:
            </p>
            
            <ul style="color: #4a4a4a; font-size: 14px; line-height: 24px; margin: 0 0 24px 0; padding: 0 0 0 20px;">
                <li style="margin: 8px 0;">📸 Upload outfit photos for instant AI ratings</li>
                <li style="margin: 8px 0;">💡 Get personalized style improvement tips</li>
                <li style="margin: 8px 0;">🎨 Discover your perfect color palette</li>
                <li style="margin: 8px 0;">✨ Build a wardrobe that truly fits your style</li>
            </ul>
            
            <!-- Verification Code -->
            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 16px 24px; margin: 24px 0; text-align: center;">
                <p style="color: #4a4a4a; font-size: 14px; margin: 0 0 8px 0;">Or use this verification code:</p>
                <code style="font-family: monospace; font-size: 18px; font-weight: bold; color: #333;">${token}</code>
            </div>
            
            <p style="color: #8a8a8a; font-size: 14px; line-height: 20px; margin: 32px 0 16px 0;">
                If you didn't create this account, you can safely ignore this email.
            </p>
            
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e9ecef;">
            <p style="color: #4a4a4a; font-size: 14px; margin: 0;">
                Happy styling,<br />
                <strong>The RateMyFit Team 🌟</strong>
            </p>
            <p style="color: #8a8a8a; font-size: 12px; margin: 16px 0 0 0;">
                © ${new Date().getFullYear()} RateMyFit
            </p>
        </div>
        
    </div>
</body>
</html>
    `

    // Send the email via Resend
    const { error } = await resend.emails.send({
      from: 'RateMyFit <verify@ratemyfit.app>',
      to: [user.email],
      subject: 'Welcome to RateMyFit! Verify your email to get started 👗',
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      throw error
    }

    console.log('Verification email sent successfully to:', user.email)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })

  } catch (error) {
    console.error('Error in send-verification-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})