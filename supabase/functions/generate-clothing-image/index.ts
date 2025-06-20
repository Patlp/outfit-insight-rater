
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ColorAwareRequest {
  itemName: string;
  wardrobeItemId: string;
  arrayIndex: number;
  colorPrompt?: string;
  colorData?: {
    primaryColor?: string;
    colorConfidence?: number;
    category?: string;
    fullDescription?: string;
  };
}

interface ColorAwareResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: {
    processingTime: number;
    colorEnhanced: boolean;
    primaryColor?: string;
    generationMethod: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();
  
  console.log(`[${requestId}] 🚀 Color-aware OpenAI image generation starting`);

  try {
    const { 
      itemName, 
      wardrobeItemId, 
      arrayIndex, 
      colorPrompt,
      colorData
    }: ColorAwareRequest = await req.json();

    if (!itemName || !wardrobeItemId || arrayIndex === undefined) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 🎯 Color-aware processing: "${itemName}"`);
    console.log(`[${requestId}] 🎨 Color data:`, colorData);

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

    // Use color-aware prompt if provided, otherwise generate basic prompt
    let finalPrompt = colorPrompt;
    
    if (!finalPrompt) {
      // Fallback to basic color-aware prompt generation
      const primaryColor = colorData?.primaryColor || 'neutral colored';
      const category = colorData?.category || 'garment';
      
      finalPrompt = `Professional product photography of a single ${primaryColor} ${itemName}, floating with invisible support on pure white seamless background, professional studio lighting with accurate color representation, clean isolated presentation with no shadows, high resolution catalog style`;
    }

    console.log(`[${requestId}] 📝 Using prompt: ${finalPrompt.slice(0, 100)}...`);

    // Enhanced OpenAI generation with color accuracy focus
    console.log(`[${requestId}] 🤖 Calling color-aware OpenAI DALL-E API...`);
    
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: finalPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        style: 'natural', // Use natural style for better color accuracy
        response_format: 'url'
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error(`[${requestId}] ❌ Color-aware OpenAI API error:`, errorData);
      
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

    console.log(`[${requestId}] ✅ Color-aware image generated from OpenAI`);

    // Download the color-aware generated image
    console.log(`[${requestId}] 📥 Downloading color-aware generated image...`);
    
    const imageResponse = await fetch(generatedImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    console.log(`[${requestId}] 📁 Color-aware image downloaded: ${imageBlob.size} bytes`);
    
    // Create optimized filename with color metadata
    const sanitizedItemName = itemName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const colorPrefix = colorData?.primaryColor ? `${colorData.primaryColor.replace(/\s+/g, '_').toLowerCase()}_` : '';
    const fileName = `color_aware/${wardrobeItemId}/${arrayIndex}_${colorPrefix}${sanitizedItemName}_${Date.now()}.png`;
    
    console.log(`[${requestId}] 💾 Uploading color-aware image: ${fileName}`);
    
    // Upload to Supabase storage
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('clothing-renders')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error(`[${requestId}] ❌ Color-aware upload failed:`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('clothing-renders')
      .getPublicUrl(fileName);

    // Verify URL accessibility
    try {
      const verifyResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (verifyResponse.ok) {
        console.log(`[${requestId}] ✅ Color-aware URL verified`);
      } else {
        console.warn(`[${requestId}] ⚠️ Color-aware URL verification failed: ${verifyResponse.status}`);
      }
    } catch (verifyError) {
      console.warn(`[${requestId}] ⚠️ URL verification error:`, verifyError);
    }

    const processingTime = Date.now() - startTime;

    const response: ColorAwareResponse = {
      success: true,
      imageUrl: publicUrl,
      metadata: {
        processingTime,
        colorEnhanced: !!colorData?.primaryColor,
        primaryColor: colorData?.primaryColor,
        generationMethod: 'openai_color_aware'
      }
    };

    console.log(`[${requestId}] 🎉 Color-aware OpenAI generation completed in ${processingTime}ms`);
    if (colorData?.primaryColor) {
      console.log(`[${requestId}] 🎨 Generated with primary color: ${colorData.primaryColor}`);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Color-aware OpenAI error (${processingTime}ms):`, error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
