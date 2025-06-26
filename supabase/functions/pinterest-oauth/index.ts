
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { action, code, state, userId } = await req.json();

    if (action === 'exchange_code') {
      console.log('🔄 Exchanging Pinterest authorization code for access token');
      
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://api.pinterest.com/v5/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${Deno.env.get('PINTEREST_CLIENT_ID')}:${Deno.env.get('PINTEREST_APP_SECRET')}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: `${req.headers.get('origin')}/wardrobe?pinterest_callback=true`,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('❌ Pinterest token exchange failed:', errorText);
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('✅ Pinterest access token obtained');

      // Get user profile information
      const userResponse = await fetch('https://api.pinterest.com/v5/user_account', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user profile: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      console.log('✅ Pinterest user profile fetched:', userData.username);

      // Save connection to database
      const { data: connection, error: connectionError } = await supabaseClient
        .from('pinterest_connections')
        .upsert({
          user_id: userId,
          pinterest_user_id: userData.account_type === 'BUSINESS' ? userData.business_name : userData.username,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
          username: userData.username,
          display_name: userData.business_name || userData.username,
          profile_image_url: userData.profile_image,
          board_count: userData.board_count || 0,
          pin_count: userData.pin_count || 0,
          follower_count: userData.follower_count || 0,
          is_active: true,
          sync_enabled: true,
          sync_frequency: 'daily'
        }, {
          onConflict: 'user_id,pinterest_user_id'
        })
        .select()
        .single();

      if (connectionError) {
        console.error('❌ Failed to save Pinterest connection:', connectionError);
        throw connectionError;
      }

      console.log('✅ Pinterest connection saved successfully');

      return new Response(JSON.stringify({
        success: true,
        connection: connection
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Pinterest OAuth error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Authentication failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
