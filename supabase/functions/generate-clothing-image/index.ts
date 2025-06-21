
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContextAwareRequest {
  itemName: string;
  wardrobeItemId: string;
  arrayIndex: number;
  contextAwarePrompt?: string;
  contextData?: {
    primaryColor?: string;
    colorConfidence?: number;
    category?: string;
    fullDescription?: string;
    originalImageUrl?: string;
    preservedContext?: boolean;
  };
  // Legacy support
  colorPrompt?: string;
  colorData?: any;
}

interface ContextAwareResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: {
    processingTime: number;
    contextAware: boolean;
    colorPreserved: boolean;
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
  
  console.log(`[${requestId}] 🚀 Context-aware OpenAI image generation starting`);

  try {
    const { 
      itemName, 
      wardrobeItemId, 
      arrayIndex, 
      contextAwarePrompt,
      contextData,
      // Legacy support
      colorPrompt,
      colorData
    }: ContextAwareRequest = await req.json();

    if (!itemName || !wardrobeItemId || arrayIndex === undefined) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 🎯 Context-aware processing: "${itemName}"`);
    console.log(`[${requestId}] 🎨 Context data:`, contextData);

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

    // Use context-aware prompt if provided, otherwise fallback to legacy or basic
    let finalPrompt = contextAwarePrompt || colorPrompt;
    
    if (!finalPrompt) {
      // Generate basic context-aware prompt
      const primaryColor = contextData?.primaryColor || colorData?.primaryColor || 'neutral colored';
      const category = contextData?.category || 'garment';
      
      finalPrompt = `Professional product photography of a "${itemName}", emphasizing accurate ${primaryColor} color representation, floating with invisible support on pure white seamless background, professional studio lighting with exact color fidelity, high resolution catalog style, clean isolated presentation with no shadows`;
      
      // Add negative prompt
      finalPrompt += `\n\nNEGATIVE PROMPT: no mannequin, no model, no person, no background elements, no additional clothing, no accessories, no shadows, no logos, no color distortion, maintain exact ${primaryColor} color tone`;
    }

    console.log(`[${requestId}] 📝 Using context-aware prompt: ${finalPrompt.slice(0, 100)}...`);

    // Enhanced OpenAI generation with context and color accuracy focus
    console.log(`[${requestId}] 🤖 Calling context-aware OpenAI DALL-E API...`);
    
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
        style: 'natural', // Use natural style for better accuracy
        response_format: 'url'
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error(`[${requestId}] ❌ Context-aware OpenAI API error:`, errorData);
      
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

    console.log(`[${requestId}] ✅ Context-aware image generated from OpenAI`);

    // Download the context-aware generated image
    console.log(`[${requestId}] 📥 Downloading context-aware generated image...`);
    
    const imageResponse = await fetch(generatedImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    console.log(`[${requestId}] 📁 Context-aware image downloaded: ${imageBlob.size} bytes`);
    
    // Create optimized filename with context metadata
    const sanitizedItemName = itemName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const contextPrefix = contextData?.preservedContext ? 'context_aware' : 'color_aware';
    const colorPrefix = contextData?.primaryColor ? `${contextData.primaryColor.replace(/\s+/g, '_').toLowerCase()}_` : '';
    const fileName = `${contextPrefix}/${wardrobeItemId}/${arrayIndex}_${colorPrefix}${sanitizedItemName}_${Date.now()}.png`;
    
    console.log(`[${requestId}] 💾 Uploading context-aware image: ${fileName}`);
    
    // Upload to Supabase storage
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('clothing-renders')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error(`[${requestId}] ❌ Context-aware upload failed:`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('clothing-renders')
      .getPublicUrl(fileName);

    // Verify URL accessibility
    try {
      const verifyResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (verifyResponse.ok) {
        console.log(`[${requestId}] ✅ Context-aware URL verified`);
      } else {
        console.warn(`[${requestId}] ⚠️ Context-aware URL verification failed: ${verifyResponse.status}`);
      }
    } catch (verifyError) {
      console.warn(`[${requestId}] ⚠️ URL verification error:`, verifyError);
    }

    const processingTime = Date.now() - startTime;

    const response: ContextAwareResponse = {
      success: true,
      imageUrl: publicUrl,
      metadata: {
        processingTime,
        contextAware: !!contextAwarePrompt,
        colorPreserved: contextData?.preservedContext || false,
        primaryColor: contextData?.primaryColor,
        generationMethod: 'openai_context_aware'
      }
    };

    console.log(`[${requestId}] 🎉 Context-aware OpenAI generation completed in ${processingTime}ms`);
    if (contextData?.primaryColor) {
      console.log(`[${requestId}] 🎨 Generated with preserved color context: ${contextData.primaryColor}`);
    }
    if (contextAwarePrompt) {
      console.log(`[${requestId}] 📝 Used context-aware prompting for maximum accuracy`);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Context-aware OpenAI error (${processingTime}ms):`, error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
