
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateImageRequest {
  itemName: string;
  wardrobeItemId: string;
  arrayIndex: number;
  originalImageUrl?: string;
  useCroppedImage?: boolean;
}

interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  fallbackToOpenAI?: boolean;
  debugInfo?: any;
  userMessage?: string;
}

// TheNewBlack API authentication and image generation
async function authenticateTheNewBlack(requestId: string, email: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    console.log(`[${requestId}] 🔐 Authenticating with TheNewBlack API...`);
    
    const authResponse = await fetch('https://api.thenewblack.ai/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error(`[${requestId}] ❌ Auth failed: ${authResponse.status} - ${errorText}`);
      return {
        success: false,
        error: `Authentication failed: ${authResponse.status} ${authResponse.statusText}`
      };
    }

    const authData = await authResponse.json();
    console.log(`[${requestId}] ✅ Authentication successful`);
    
    // Extract token from response
    const token = authData.access_token || authData.token || authData.jwt;
    
    if (!token) {
      console.error(`[${requestId}] ❌ No token found in auth response`);
      return {
        success: false,
        error: 'No authentication token received'
      };
    }

    return {
      success: true,
      token: token
    };

  } catch (error) {
    console.error(`[${requestId}] ❌ Authentication error:`, error);
    return {
      success: false,
      error: `Authentication failed: ${error.message}`
    };
  }
}

async function generateTheNewBlackImage(requestId: string, token: string, itemName: string, imageBlob?: Blob): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    console.log(`[${requestId}] 🎨 Generating image with TheNewBlack API...`);

    const formData = new FormData();
    
    if (imageBlob) {
      // Image-to-image generation (ghost mannequin style)
      formData.append('image', imageBlob, 'clothing.jpg');
      formData.append('mode', 'ghost_mannequin');
      formData.append('style', 'product');
      formData.append('background', 'white');
    } else {
      // Text-to-image generation
      const prompt = `Professional product photography of ${itemName}, clean white background, studio lighting, high quality fashion photography, ghost mannequin style`;
      formData.append('prompt', prompt);
      formData.append('mode', 'text_to_image');
      formData.append('style', 'product');
      formData.append('background', 'white');
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
      return {
        success: false,
        error: `Image generation failed: ${generationResponse.status} ${generationResponse.statusText}`
      };
    }

    const generationData = await generationResponse.json();
    console.log(`[${requestId}] 📋 Generation response received`);
    
    // Extract image URL from response
    const imageUrl = generationData.image_url || generationData.url || generationData.result_url;
    
    if (!imageUrl) {
      console.error(`[${requestId}] ❌ No image URL in generation response`);
      return {
        success: false,
        error: 'No image URL received from generation'
      };
    }

    console.log(`[${requestId}] ✅ Image generated successfully`);
    return {
      success: true,
      imageUrl: imageUrl
    };

  } catch (error) {
    console.error(`[${requestId}] ❌ Generation error:`, error);
    return {
      success: false,
      error: `Image generation failed: ${error.message}`
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] 🚀 Starting TheNewBlack API integration`);

  try {
    const { itemName, wardrobeItemId, arrayIndex, originalImageUrl, useCroppedImage }: GenerateImageRequest = await req.json();

    if (!itemName || !wardrobeItemId || arrayIndex === undefined) {
      console.error(`[${requestId}] ❌ Missing required parameters`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters',
          userMessage: 'Invalid request parameters'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] 🎯 Processing: "${itemName}" for wardrobe ${wardrobeItemId}[${arrayIndex}]`);

    // Get API credentials
    const thenewblackEmail = Deno.env.get('THENEWBLACK_EMAIL');
    const thenewblackPassword = Deno.env.get('THENEWBLACK_PASSWORD');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!thenewblackEmail || !thenewblackPassword) {
      console.error(`[${requestId}] ❌ TheNewBlack credentials not configured`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'TheNewBlack API credentials not configured',
          fallbackToOpenAI: true,
          userMessage: 'TheNewBlack API credentials missing. Please configure THENEWBLACK_EMAIL and THENEWBLACK_PASSWORD.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] ❌ Supabase configuration missing`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Supabase configuration missing',
          userMessage: 'Server configuration error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Authenticate with TheNewBlack API
    const authResult = await authenticateTheNewBlack(requestId, thenewblackEmail, thenewblackPassword);
    
    if (!authResult.success) {
      console.error(`[${requestId}] ❌ Authentication failed: ${authResult.error}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authResult.error,
          fallbackToOpenAI: true,
          userMessage: 'TheNewBlack API authentication failed. Switching to backup AI service.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] ✅ Authentication successful`);

    // Step 2: Download original image if provided
    let imageBlob: Blob | undefined;
    if (originalImageUrl) {
      console.log(`[${requestId}] 📥 Downloading original image...`);
      
      try {
        const imageResponse = await fetch(originalImageUrl);
        if (imageResponse.ok) {
          imageBlob = await imageResponse.blob();
          console.log(`[${requestId}] ✅ Downloaded image: ${imageBlob.size} bytes`);
        } else {
          console.warn(`[${requestId}] ⚠️ Failed to download image: ${imageResponse.status}`);
        }
      } catch (error) {
        console.warn(`[${requestId}] ⚠️ Error downloading image:`, error.message);
      }
    }

    // Step 3: Generate AI image
    const generationResult = await generateTheNewBlackImage(requestId, authResult.token!, itemName, imageBlob);
    
    if (!generationResult.success) {
      console.error(`[${requestId}] ❌ Image generation failed: ${generationResult.error}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: generationResult.error,
          fallbackToOpenAI: true,
          userMessage: 'TheNewBlack image generation failed. Switching to backup AI service.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Download and upload the generated image to Supabase storage
    console.log(`[${requestId}] 📥 Downloading generated image...`);
    
    const generatedImageResponse = await fetch(generationResult.imageUrl!);
    
    if (!generatedImageResponse.ok) {
      console.error(`[${requestId}] ❌ Failed to download generated image: ${generatedImageResponse.status}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to download generated image',
          fallbackToOpenAI: true,
          userMessage: 'Generated image download failed. Please try again.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const generatedImageBlob = await generatedImageResponse.blob();
    console.log(`[${requestId}] 📁 Downloaded generated image: ${generatedImageBlob.size} bytes`);
    
    // Step 5: Upload to Supabase storage
    const sanitizedItemName = itemName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const fileName = `${wardrobeItemId}/${arrayIndex}_${sanitizedItemName}_thenewblack_${Date.now()}.jpg`;
    
    console.log(`[${requestId}] 💾 Uploading to storage: ${fileName}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('clothing-renders')
      .upload(fileName, generatedImageBlob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error(`[${requestId}] ❌ Upload failed:`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('clothing-renders')
      .getPublicUrl(fileName);

    console.log(`[${requestId}] 🌐 Generated public URL: ${publicUrl}`);

    const response: GenerateImageResponse = {
      success: true,
      imageUrl: publicUrl,
      debugInfo: {
        authenticationStatus: 'success',
        generationStatus: 'success',
        uploadStatus: 'success',
        usedOriginalImage: !!imageBlob
      }
    };

    console.log(`[${requestId}] 🎉 TheNewBlack API integration completed successfully`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ TheNewBlack API integration error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackToOpenAI: true,
        userMessage: 'AI image generation encountered an error. Using backup service instead.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
