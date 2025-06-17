
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
}

interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] 🎨 Starting TheNewBlack Ghost Mannequin generation`);

  try {
    const { itemName, wardrobeItemId, arrayIndex, originalImageUrl }: GenerateImageRequest = await req.json();

    if (!itemName || !wardrobeItemId || arrayIndex === undefined) {
      console.error(`[${requestId}] ❌ Missing required parameters:`, { itemName, wardrobeItemId, arrayIndex });
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] 🎯 Processing: "${itemName}" for wardrobe ${wardrobeItemId}[${arrayIndex}]`);

    // Get API credentials from environment
    const thenewblackEmail = Deno.env.get('THENEWBLACK_EMAIL');
    const thenewblackPassword = Deno.env.get('THENEWBLACK_PASSWORD');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!thenewblackEmail || !thenewblackPassword) {
      console.error(`[${requestId}] ❌ TheNewBlack credentials not configured`);
      return new Response(
        JSON.stringify({ success: false, error: 'TheNewBlack API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] ❌ Supabase configuration missing`);
      return new Response(
        JSON.stringify({ success: false, error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Authenticate with TheNewBlack API
    console.log(`[${requestId}] 🔐 Authenticating with TheNewBlack API...`);
    
    const authResponse = await fetch('https://api.thenewblack.ai/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: thenewblackEmail,
        password: thenewblackPassword
      })
    });

    if (!authResponse.ok) {
      console.error(`[${requestId}] ❌ Authentication failed:`, authResponse.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to authenticate with TheNewBlack API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    
    if (!accessToken) {
      console.error(`[${requestId}] ❌ No access token received`);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get access token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] ✅ Authentication successful`);

    // Step 2: Download the original image if provided
    let imageBlob: Blob | undefined;
    if (originalImageUrl) {
      console.log(`[${requestId}] 📥 Downloading original image...`);
      
      try {
        const imageResponse = await fetch(originalImageUrl);
        if (imageResponse.ok) {
          imageBlob = await imageResponse.blob();
          console.log(`[${requestId}] ✅ Downloaded image: ${imageBlob.size} bytes`);
        } else {
          console.warn(`[${requestId}] ⚠️ Failed to download original image: ${imageResponse.status}`);
        }
      } catch (error) {
        console.warn(`[${requestId}] ⚠️ Error downloading original image:`, error);
      }
    }

    // Step 3: Generate Ghost Mannequin image
    console.log(`[${requestId}] 👻 Starting Ghost Mannequin generation...`);

    const formData = new FormData();
    
    if (imageBlob) {
      // Use the original image if available
      formData.append('image', imageBlob, 'clothing.jpg');
      formData.append('mode', 'ghost_mannequin');
      formData.append('style', 'professional');
      formData.append('background', 'white');
    } else {
      // If no original image, generate from text description
      const prompt = `Professional product photography of ${itemName}, ghost mannequin style, white background, studio lighting, high quality, fashion e-commerce`;
      formData.append('prompt', prompt);
      formData.append('mode', 'text_to_image');
      formData.append('style', 'ghost_mannequin');
      formData.append('background', 'white');
    }

    const generationResponse = await fetch('https://api.thenewblack.ai/v1/ghost-mannequin/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData
    });

    if (!generationResponse.ok) {
      const errorData = await generationResponse.json().catch(() => null);
      console.error(`[${requestId}] ❌ Ghost Mannequin generation failed:`, {
        status: generationResponse.status,
        error: errorData
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `TheNewBlack API error: ${generationResponse.status} - ${errorData?.message || 'Unknown error'}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const generationData = await generationResponse.json();
    
    if (!generationData.image_url) {
      console.error(`[${requestId}] ❌ No image URL in response:`, generationData);
      return new Response(
        JSON.stringify({ success: false, error: 'No image URL returned from TheNewBlack API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] ✅ Ghost Mannequin image generated successfully`);

    // Step 4: Download the generated image
    console.log(`[${requestId}] 📥 Downloading generated image...`);
    
    const generatedImageResponse = await fetch(generationData.image_url);
    
    if (!generatedImageResponse.ok) {
      console.error(`[${requestId}] ❌ Failed to download generated image:`, generatedImageResponse.status);
      throw new Error(`Failed to download generated image: ${generatedImageResponse.status}`);
    }

    const generatedImageBlob = await generatedImageResponse.blob();
    console.log(`[${requestId}] 📁 Downloaded generated image: ${generatedImageBlob.size} bytes`);
    
    // Step 5: Upload to Supabase storage
    const sanitizedItemName = itemName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const fileName = `${wardrobeItemId}/${arrayIndex}_${sanitizedItemName}_thenewblack_${Date.now()}.jpg`;
    
    console.log(`[${requestId}] 💾 Uploading to storage: ${fileName}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upload to Supabase storage with retry logic
    let uploadAttempt = 0;
    const maxRetries = 3;
    let uploadData, uploadError;

    while (uploadAttempt < maxRetries) {
      uploadAttempt++;
      console.log(`[${requestId}] 📤 Upload attempt ${uploadAttempt}/${maxRetries}`);

      const uploadResult = await supabase.storage
        .from('clothing-renders')
        .upload(fileName, generatedImageBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      uploadData = uploadResult.data;
      uploadError = uploadResult.error;

      if (!uploadError) {
        console.log(`[${requestId}] ✅ Upload successful on attempt ${uploadAttempt}`);
        break;
      }

      console.warn(`[${requestId}] ⚠️ Upload attempt ${uploadAttempt} failed:`, uploadError);
      
      if (uploadAttempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempt));
      }
    }

    if (uploadError) {
      console.error(`[${requestId}] ❌ All upload attempts failed:`, uploadError);
      throw new Error(`Upload failed after ${maxRetries} attempts: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('clothing-renders')
      .getPublicUrl(fileName);

    console.log(`[${requestId}] 🌐 Generated public URL: ${publicUrl}`);

    const response: GenerateImageResponse = {
      success: true,
      imageUrl: publicUrl
    };

    console.log(`[${requestId}] 🎉 TheNewBlack Ghost Mannequin generation completed successfully`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ TheNewBlack image generation error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during TheNewBlack image generation' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
