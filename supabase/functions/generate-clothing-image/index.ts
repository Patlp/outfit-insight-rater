
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
  console.log(`[${requestId}] 🎨 Starting AI image generation request`);

  try {
    const { itemName, wardrobeItemId, arrayIndex }: GenerateImageRequest = await req.json();

    if (!itemName || !wardrobeItemId || arrayIndex === undefined) {
      console.error(`[${requestId}] ❌ Missing required parameters:`, { itemName, wardrobeItemId, arrayIndex });
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] 🎯 Processing: "${itemName}" for wardrobe ${wardrobeItemId}[${arrayIndex}]`);

    // Get API keys from environment with detailed logging
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openaiApiKey) {
      console.error(`[${requestId}] ❌ OpenAI API key not configured`);
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
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

    // Create enhanced prompt for DALL-E with better specificity
    const prompt = `A high-quality product photography style image of a ${itemName}. The item should be displayed flat lay style or on a clean white mannequin torso, professionally lit with soft studio lighting. The background is pure white. The image should be clean, minimalist, and focus entirely on the ${itemName} with no other clothing items, text, or distracting elements. Style: professional fashion photography, catalog style, high resolution.`;

    console.log(`[${requestId}] 📝 Using enhanced prompt for: ${itemName}`);

    // Generate image using OpenAI DALL-E with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      console.log(`[${requestId}] 🤖 Calling OpenAI DALL-E API...`);
      
      const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'hd',
          style: 'natural'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        console.error(`[${requestId}] ❌ OpenAI API error:`, {
          status: openaiResponse.status,
          statusText: openaiResponse.statusText,
          error: errorData
        });
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `OpenAI API error: ${openaiResponse.status} - ${errorData.error?.message || 'Unknown error'}` 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const openaiData = await openaiResponse.json();
      const generatedImageUrl = openaiData.data[0].url;

      console.log(`[${requestId}] ✅ Image generated successfully from OpenAI`);

      // Download the generated image with timeout
      console.log(`[${requestId}] 📥 Downloading generated image...`);
      
      const downloadController = new AbortController();
      const downloadTimeoutId = setTimeout(() => downloadController.abort(), 15000); // 15 second timeout

      const imageResponse = await fetch(generatedImageUrl, {
        signal: downloadController.signal
      });
      
      clearTimeout(downloadTimeoutId);

      if (!imageResponse.ok) {
        console.error(`[${requestId}] ❌ Failed to download generated image:`, imageResponse.status);
        throw new Error(`Failed to download generated image: ${imageResponse.status}`);
      }

      const imageBlob = await imageResponse.blob();
      console.log(`[${requestId}] 📁 Downloaded image blob: ${imageBlob.size} bytes`);
      
      // Create optimized filename for storage
      const sanitizedItemName = itemName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      const fileName = `${wardrobeItemId}/${arrayIndex}_${sanitizedItemName}_${Date.now()}.png`;
      
      console.log(`[${requestId}] 💾 Uploading to storage: ${fileName}`);
      
      // Initialize Supabase client
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
          .upload(fileName, imageBlob, {
            contentType: 'image/png',
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
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempt)); // Exponential backoff
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

      // Verify the URL is accessible
      try {
        const verifyResponse = await fetch(publicUrl, { method: 'HEAD' });
        if (verifyResponse.ok) {
          console.log(`[${requestId}] ✅ URL verification successful`);
        } else {
          console.warn(`[${requestId}] ⚠️ URL verification failed: ${verifyResponse.status}`);
        }
      } catch (verifyError) {
        console.warn(`[${requestId}] ⚠️ URL verification error:`, verifyError);
      }

      const response: GenerateImageResponse = {
        success: true,
        imageUrl: publicUrl
      };

      console.log(`[${requestId}] 🎉 AI image generation completed successfully`);

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error(`[${requestId}] ❌ Request timeout during OpenAI API call`);
        return new Response(
          JSON.stringify({ success: false, error: 'Request timeout - please try again' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error(`[${requestId}] ❌ Generate clothing image error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during image generation' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
