
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
  fallbackToOpenAI?: boolean;
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
        JSON.stringify({ 
          success: false, 
          error: 'TheNewBlack API credentials not configured',
          fallbackToOpenAI: true 
        }),
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

    // Step 1: Test API connectivity and authenticate with retry logic
    console.log(`[${requestId}] 🔐 Authenticating with TheNewBlack API...`);
    
    let accessToken: string | null = null;
    let authAttempts = 0;
    const maxAuthAttempts = 2;

    while (authAttempts < maxAuthAttempts && !accessToken) {
      authAttempts++;
      console.log(`[${requestId}] 🔄 Auth attempt ${authAttempts}/${maxAuthAttempts}`);
      
      try {
        const authController = new AbortController();
        const authTimeout = setTimeout(() => authController.abort(), 15000); // 15 second timeout
        
        const authResponse = await fetch('https://api.thenewblack.ai/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'RateMyFit-App/1.0',
          },
          body: JSON.stringify({
            email: thenewblackEmail,
            password: thenewblackPassword
          }),
          signal: authController.signal
        });

        clearTimeout(authTimeout);

        if (!authResponse.ok) {
          console.error(`[${requestId}] ❌ Authentication failed with status:`, authResponse.status);
          const errorText = await authResponse.text().catch(() => 'No error details available');
          console.error(`[${requestId}] Error details:`, errorText);
          
          if (authAttempts >= maxAuthAttempts) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `TheNewBlack authentication failed: ${authResponse.status}`,
                fallbackToOpenAI: true 
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          continue;
        }

        const authData = await authResponse.json();
        accessToken = authData.access_token;
        
        if (!accessToken) {
          console.error(`[${requestId}] ❌ No access token received from API`);
          if (authAttempts >= maxAuthAttempts) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Failed to get access token from TheNewBlack API',
                fallbackToOpenAI: true 
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          continue;
        }

        console.log(`[${requestId}] ✅ Authentication successful on attempt ${authAttempts}`);
        break;

      } catch (error) {
        console.error(`[${requestId}] ❌ Auth attempt ${authAttempts} failed with error:`, error.message);
        
        if (error.name === 'AbortError') {
          console.error(`[${requestId}] ❌ Authentication request timed out`);
        }
        
        if (authAttempts >= maxAuthAttempts) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `TheNewBlack API connection failed: ${error.message}. Please check if the API is accessible.`,
              fallbackToOpenAI: true 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // If we got here without a token, something went wrong
    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to authenticate with TheNewBlack API after multiple attempts',
          fallbackToOpenAI: true 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Download the original image if provided
    let imageBlob: Blob | undefined;
    if (originalImageUrl) {
      console.log(`[${requestId}] 📥 Downloading original image...`);
      
      try {
        const imageController = new AbortController();
        const imageTimeout = setTimeout(() => imageController.abort(), 10000);
        
        const imageResponse = await fetch(originalImageUrl, {
          signal: imageController.signal
        });
        
        clearTimeout(imageTimeout);
        
        if (imageResponse.ok) {
          imageBlob = await imageResponse.blob();
          console.log(`[${requestId}] ✅ Downloaded image: ${imageBlob.size} bytes`);
        } else {
          console.warn(`[${requestId}] ⚠️ Failed to download original image: ${imageResponse.status}`);
        }
      } catch (error) {
        console.warn(`[${requestId}] ⚠️ Error downloading original image:`, error.message);
      }
    }

    // Step 3: Generate Ghost Mannequin image with timeout
    console.log(`[${requestId}] 👻 Starting Ghost Mannequin generation...`);

    try {
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

      const genController = new AbortController();
      const genTimeout = setTimeout(() => genController.abort(), 60000); // 60 second timeout

      const generationResponse = await fetch('https://api.thenewblack.ai/v1/ghost-mannequin/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
        signal: genController.signal
      });

      clearTimeout(genTimeout);

      if (!generationResponse.ok) {
        const errorData = await generationResponse.json().catch(() => null);
        console.error(`[${requestId}] ❌ Ghost Mannequin generation failed:`, {
          status: generationResponse.status,
          error: errorData
        });
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `TheNewBlack generation failed: ${generationResponse.status} - ${errorData?.message || 'Unknown error'}`,
            fallbackToOpenAI: true 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const generationData = await generationResponse.json();
      
      if (!generationData.image_url) {
        console.error(`[${requestId}] ❌ No image URL in response:`, generationData);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No image URL returned from TheNewBlack API',
            fallbackToOpenAI: true 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[${requestId}] ✅ Ghost Mannequin image generated successfully`);

      // Step 4: Download and upload the generated image
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
        imageUrl: publicUrl
      };

      console.log(`[${requestId}] 🎉 TheNewBlack Ghost Mannequin generation completed successfully`);

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error(`[${requestId}] ❌ Generation process failed:`, error.message);
      
      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'TheNewBlack generation request timed out',
            fallbackToOpenAI: true 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw error;
    }

  } catch (error) {
    console.error(`[${requestId}] ❌ TheNewBlack image generation error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during TheNewBlack image generation',
        fallbackToOpenAI: true 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
