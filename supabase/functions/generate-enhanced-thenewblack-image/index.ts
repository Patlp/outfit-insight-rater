
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnhancedGenerationRequest {
  itemName: string;
  wardrobeItemId: string;
  arrayIndex: number;
  enhancedPrompt: string;
  originalImageUrl?: string;
  style?: 'ghost_mannequin' | 'flat_lay' | 'product_shot';
  quality?: 'professional' | 'standard';
}

interface EnhancedGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: {
    processingTime: number;
    prompt: string;
    style: string;
    quality: string;
    provider: string;
  };
}

async function authenticateTheNewBlack(requestId: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    console.log(`[${requestId}] 🔐 Enhanced TheNewBlack authentication...`);
    
    const email = Deno.env.get('THENEWBLACK_EMAIL');
    const password = Deno.env.get('THENEWBLACK_PASSWORD');
    
    if (!email || !password) {
      return { success: false, error: 'TheNewBlack credentials not configured' };
    }

    const authResponse = await fetch('https://api.thenewblack.ai/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error(`[${requestId}] ❌ Auth failed: ${authResponse.status} - ${errorText}`);
      return { success: false, error: `Authentication failed: ${authResponse.status}` };
    }

    const authData = await authResponse.json();
    const token = authData.access_token || authData.token || authData.jwt;
    
    if (!token) {
      return { success: false, error: 'No authentication token received' };
    }

    console.log(`[${requestId}] ✅ Enhanced authentication successful`);
    return { success: true, token };

  } catch (error) {
    console.error(`[${requestId}] ❌ Authentication error:`, error);
    return { success: false, error: `Authentication failed: ${error.message}` };
  }
}

async function generateEnhancedImage(
  requestId: string, 
  token: string, 
  prompt: string, 
  style: string,
  imageBlob?: Blob
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    console.log(`[${requestId}] 🎨 Enhanced image generation with professional parameters...`);

    const formData = new FormData();
    
    if (imageBlob) {
      // Enhanced image-to-image with professional ghost mannequin
      formData.append('image', imageBlob, 'source.jpg');
      formData.append('prompt', prompt);
      formData.append('mode', 'img2img');
      formData.append('style', 'ghost_mannequin');
      formData.append('background', 'pure_white');
      formData.append('lighting', 'studio_professional');
      formData.append('quality', 'ultra_high');
      formData.append('resolution', '1024x1024');
    } else {
      // Enhanced text-to-image with professional styling
      formData.append('prompt', prompt);
      formData.append('mode', 'text2img');
      formData.append('style', style);
      formData.append('background', 'pure_white');
      formData.append('lighting', 'professional_studio');
      formData.append('quality', 'ultra_high');
      formData.append('resolution', '1024x1024');
      formData.append('negative_prompt', 'low quality, blurry, dark, shadow, wrinkled, poor lighting, amateur');
    }

    const generationResponse = await fetch('https://api.thenewblack.ai/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!generationResponse.ok) {
      const errorText = await generationResponse.text();
      console.error(`[${requestId}] ❌ Generation failed: ${generationResponse.status} - ${errorText}`);
      return { success: false, error: `Generation failed: ${generationResponse.status}` };
    }

    const generationData = await generationResponse.json();
    const imageUrl = generationData.image_url || generationData.url || generationData.result_url;
    
    if (!imageUrl) {
      return { success: false, error: 'No image URL in response' };
    }

    console.log(`[${requestId}] ✅ Enhanced image generated successfully`);
    return { success: true, imageUrl };

  } catch (error) {
    console.error(`[${requestId}] ❌ Enhanced generation error:`, error);
    return { success: false, error: `Generation failed: ${error.message}` };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();
  
  console.log(`[${requestId}] 🚀 Enhanced TheNewBlack API integration starting`);

  try {
    const { 
      itemName, 
      wardrobeItemId, 
      arrayIndex, 
      enhancedPrompt,
      originalImageUrl,
      style = 'ghost_mannequin',
      quality = 'professional'
    }: EnhancedGenerationRequest = await req.json();

    if (!itemName || !wardrobeItemId || arrayIndex === undefined || !enhancedPrompt) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 🎯 Enhanced processing: "${itemName}" with style: ${style}`);
    console.log(`[${requestId}] 📝 Enhanced prompt: ${enhancedPrompt}`);

    // Get configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Server configuration missing' 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Step 1: Enhanced authentication
    const authResult = await authenticateTheNewBlack(requestId);
    if (!authResult.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: authResult.error,
        fallbackToOpenAI: true 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Step 2: Download original image if provided
    let imageBlob: Blob | undefined;
    if (originalImageUrl) {
      console.log(`[${requestId}] 📥 Downloading source image for enhanced processing...`);
      try {
        const imageResponse = await fetch(originalImageUrl);
        if (imageResponse.ok) {
          imageBlob = await imageResponse.blob();
          console.log(`[${requestId}] ✅ Source image downloaded: ${imageBlob.size} bytes`);
        }
      } catch (error) {
        console.warn(`[${requestId}] ⚠️ Source image download failed:`, error.message);
      }
    }

    // Step 3: Enhanced image generation
    const generationResult = await generateEnhancedImage(
      requestId, 
      authResult.token!, 
      enhancedPrompt, 
      style,
      imageBlob
    );
    
    if (!generationResult.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: generationResult.error,
        fallbackToOpenAI: true 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Step 4: Download and store enhanced image
    console.log(`[${requestId}] 📥 Downloading enhanced generated image...`);
    
    const generatedImageResponse = await fetch(generationResult.imageUrl!);
    if (!generatedImageResponse.ok) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to download generated image',
        fallbackToOpenAI: true 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const generatedImageBlob = await generatedImageResponse.blob();
    console.log(`[${requestId}] 📁 Enhanced image downloaded: ${generatedImageBlob.size} bytes`);
    
    // Step 5: Upload to storage with enhanced metadata
    const sanitizedItemName = itemName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const fileName = `enhanced/${wardrobeItemId}/${arrayIndex}_${sanitizedItemName}_${style}_${Date.now()}.jpg`;
    
    console.log(`[${requestId}] 💾 Uploading enhanced image: ${fileName}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('clothing-renders')
      .upload(fileName, generatedImageBlob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error(`[${requestId}] ❌ Enhanced upload failed:`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('clothing-renders')
      .getPublicUrl(fileName);

    const processingTime = Date.now() - startTime;
    
    const response: EnhancedGenerationResponse = {
      success: true,
      imageUrl: publicUrl,
      metadata: {
        processingTime,
        prompt: enhancedPrompt,
        style,
        quality,
        provider: 'thenewblack_enhanced'
      }
    };

    console.log(`[${requestId}] 🎉 Enhanced TheNewBlack integration completed in ${processingTime}ms`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Enhanced integration error (${processingTime}ms):`, error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      fallbackToOpenAI: true 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
