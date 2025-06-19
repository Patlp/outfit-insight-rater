
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnhancedOpenAIRequest {
  itemName: string;
  wardrobeItemId: string;
  arrayIndex: number;
  enhancedPrompt: string;
  model?: string;
  size?: string;
  quality?: string;
  style?: string;
}

interface EnhancedOpenAIResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: {
    processingTime: number;
    model: string;
    prompt: string;
    size: string;
    quality: string;
    provider: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();
  
  console.log(`[${requestId}] 🚀 Enhanced OpenAI image generation starting`);

  try {
    const { 
      itemName, 
      wardrobeItemId, 
      arrayIndex, 
      enhancedPrompt,
      model = 'dall-e-3',
      size = '1024x1024',
      quality = 'hd',
      style = 'natural'
    }: EnhancedOpenAIRequest = await req.json();

    if (!itemName || !wardrobeItemId || arrayIndex === undefined || !enhancedPrompt) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 🎯 Enhanced OpenAI processing: "${itemName}"`);
    console.log(`[${requestId}] 📝 Enhanced prompt: ${enhancedPrompt.slice(0, 100)}...`);

    // Get API keys
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'API configuration missing' 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Enhanced OpenAI generation with professional parameters
    console.log(`[${requestId}] 🤖 Calling enhanced OpenAI DALL-E API...`);
    
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: enhancedPrompt,
        n: 1,
        size,
        quality,
        style,
        response_format: 'url'
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error(`[${requestId}] ❌ Enhanced OpenAI API error:`, errorData);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}` 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const openaiData = await openaiResponse.json();
    const generatedImageUrl = openaiData.data[0].url;

    console.log(`[${requestId}] ✅ Enhanced image generated from OpenAI`);

    // Download the enhanced generated image
    console.log(`[${requestId}] 📥 Downloading enhanced generated image...`);
    
    const imageResponse = await fetch(generatedImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    console.log(`[${requestId}] 📁 Enhanced image downloaded: ${imageBlob.size} bytes`);
    
    // Create optimized filename with enhanced metadata
    const sanitizedItemName = itemName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const fileName = `enhanced_openai/${wardrobeItemId}/${arrayIndex}_${sanitizedItemName}_${model}_${Date.now()}.png`;
    
    console.log(`[${requestId}] 💾 Uploading enhanced image: ${fileName}`);
    
    // Upload to Supabase storage
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('clothing-renders')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error(`[${requestId}] ❌ Enhanced upload failed:`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('clothing-renders')
      .getPublicUrl(fileName);

    // Verify URL accessibility
    try {
      const verifyResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (verifyResponse.ok) {
        console.log(`[${requestId}] ✅ Enhanced URL verified`);
      } else {
        console.warn(`[${requestId}] ⚠️ Enhanced URL verification failed: ${verifyResponse.status}`);
      }
    } catch (verifyError) {
      console.warn(`[${requestId}] ⚠️ URL verification error:`, verifyError);
    }

    const processingTime = Date.now() - startTime;

    const response: EnhancedOpenAIResponse = {
      success: true,
      imageUrl: publicUrl,
      metadata: {
        processingTime,
        model,
        prompt: enhancedPrompt,
        size,
        quality,
        provider: 'openai_enhanced'
      }
    };

    console.log(`[${requestId}] 🎉 Enhanced OpenAI generation completed in ${processingTime}ms`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Enhanced OpenAI error (${processingTime}ms):`, error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
