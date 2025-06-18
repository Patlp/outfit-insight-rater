
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
  debugInfo?: any;
}

// Test basic network connectivity
async function testNetworkConnectivity(requestId: string): Promise<{ success: boolean; details: any }> {
  const testResults = {
    httpbin: { success: false, error: null, responseTime: null },
    google: { success: false, error: null, responseTime: null },
    thenewblackDomain: { success: false, error: null, responseTime: null }
  };

  // Test 1: Basic HTTP connectivity with httpbin
  try {
    const start = Date.now();
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    testResults.httpbin.responseTime = Date.now() - start;
    testResults.httpbin.success = response.ok;
    console.log(`[${requestId}] 🌐 HttpBin test: ${response.status} (${testResults.httpbin.responseTime}ms)`);
  } catch (error) {
    testResults.httpbin.error = error.message;
    console.error(`[${requestId}] ❌ HttpBin test failed:`, error.message);
  }

  // Test 2: Google connectivity
  try {
    const start = Date.now();
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    testResults.google.responseTime = Date.now() - start;
    testResults.google.success = response.ok;
    console.log(`[${requestId}] 🌐 Google test: ${response.status} (${testResults.google.responseTime}ms)`);
  } catch (error) {
    testResults.google.error = error.message;
    console.error(`[${requestId}] ❌ Google test failed:`, error.message);
  }

  // Test 3: TheNewBlack domain connectivity (without auth)
  try {
    const start = Date.now();
    // Try to reach the domain without authentication
    const response = await fetch('https://api.thenewblack.ai/health', {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    testResults.thenewblackDomain.responseTime = Date.now() - start;
    testResults.thenewblackDomain.success = response.status !== 0;
    console.log(`[${requestId}] 🌐 TheNewBlack domain test: ${response.status} (${testResults.thenewblackDomain.responseTime}ms)`);
  } catch (error) {
    testResults.thenewblackDomain.error = error.message;
    console.error(`[${requestId}] ❌ TheNewBlack domain test failed:`, error.message);
  }

  const overallSuccess = testResults.httpbin.success || testResults.google.success;
  return { success: overallSuccess, details: testResults };
}

// Enhanced authentication with multiple endpoint attempts
async function authenticateWithRetry(requestId: string, email: string, password: string): Promise<{ success: boolean; token?: string; error?: string; debugInfo?: any }> {
  const authEndpoints = [
    'https://api.thenewblack.ai/v1/auth/login',
    'https://api.thenewblack.ai/auth/login',
    'https://thenewblack.ai/api/v1/auth/login',
    'https://thenewblack.ai/api/auth/login'
  ];

  const debugInfo = {
    attemptedEndpoints: [],
    networkTests: {},
    lastError: null
  };

  // First, test basic network connectivity
  console.log(`[${requestId}] 🔍 Testing network connectivity before authentication...`);
  const networkTest = await testNetworkConnectivity(requestId);
  debugInfo.networkTests = networkTest.details;

  if (!networkTest.success) {
    console.error(`[${requestId}] ❌ Network connectivity test failed - no internet access from edge function`);
    return {
      success: false,
      error: 'No internet connectivity detected from edge function environment',
      debugInfo
    };
  }

  console.log(`[${requestId}] ✅ Network connectivity confirmed, proceeding with authentication attempts`);

  for (const endpoint of authEndpoints) {
    console.log(`[${requestId}] 🔐 Attempting authentication with endpoint: ${endpoint}`);
    
    const attemptInfo = {
      endpoint,
      attempts: [],
      success: false
    };

    for (let attempt = 1; attempt <= 2; attempt++) {
      const attemptStart = Date.now();
      
      try {
        console.log(`[${requestId}] 🔄 Auth attempt ${attempt}/2 for ${endpoint}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'RateMyFit-App/1.0',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({
            email: email,
            password: password
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);
        const responseTime = Date.now() - attemptStart;

        const attemptResult = {
          attempt,
          responseTime,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          success: response.ok
        };

        console.log(`[${requestId}] 📊 Response: ${response.status} ${response.statusText} (${responseTime}ms)`);

        if (response.ok) {
          try {
            const authData = await response.json();
            if (authData.access_token) {
              console.log(`[${requestId}] ✅ Authentication successful with ${endpoint}`);
              attemptResult.success = true;
              attemptInfo.success = true;
              attemptInfo.attempts.push(attemptResult);
              debugInfo.attemptedEndpoints.push(attemptInfo);
              
              return {
                success: true,
                token: authData.access_token,
                debugInfo
              };
            } else {
              console.error(`[${requestId}] ❌ No access token in response from ${endpoint}`);
              attemptResult.error = 'No access token in response';
            }
          } catch (jsonError) {
            console.error(`[${requestId}] ❌ Failed to parse JSON response from ${endpoint}:`, jsonError.message);
            attemptResult.error = `JSON parse error: ${jsonError.message}`;
          }
        } else {
          const errorText = await response.text().catch(() => 'No error details available');
          console.error(`[${requestId}] ❌ Auth failed with ${endpoint}: ${response.status} - ${errorText}`);
          attemptResult.error = `HTTP ${response.status}: ${errorText}`;
        }

        attemptInfo.attempts.push(attemptResult);
        debugInfo.lastError = attemptResult.error;

      } catch (error) {
        const responseTime = Date.now() - attemptStart;
        console.error(`[${requestId}] ❌ Auth attempt ${attempt} failed with ${endpoint}:`, error.message);
        
        const attemptResult = {
          attempt,
          responseTime,
          error: error.message,
          errorType: error.name,
          success: false
        };

        if (error.name === 'AbortError') {
          attemptResult.error = 'Request timeout (15s)';
          console.error(`[${requestId}] ⏰ Authentication request timed out for ${endpoint}`);
        }

        attemptInfo.attempts.push(attemptResult);
        debugInfo.lastError = attemptResult.error;

        // Wait before retry
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    debugInfo.attemptedEndpoints.push(attemptInfo);
    
    // Wait before trying next endpoint
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    success: false,
    error: `Authentication failed with all endpoints. Last error: ${debugInfo.lastError}`,
    debugInfo
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] 🎨 Starting Enhanced TheNewBlack Ghost Mannequin generation`);

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

    // Get API credentials and Supabase config
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

    // Enhanced authentication with comprehensive debugging
    console.log(`[${requestId}] 🔐 Starting enhanced authentication process...`);
    const authResult = await authenticateWithRetry(requestId, thenewblackEmail, thenewblackPassword);
    
    if (!authResult.success) {
      console.error(`[${requestId}] ❌ All authentication attempts failed`);
      console.error(`[${requestId}] 🔍 Debug info:`, JSON.stringify(authResult.debugInfo, null, 2));
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authResult.error,
          fallbackToOpenAI: true,
          debugInfo: authResult.debugInfo
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] ✅ Authentication successful!`);
    const accessToken = authResult.token;

    // Step 2: Download original image if provided
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

    // Step 3: Generate Ghost Mannequin image with multiple endpoint attempts
    console.log(`[${requestId}] 👻 Starting Ghost Mannequin generation...`);

    const generationEndpoints = [
      'https://api.thenewblack.ai/v1/ghost-mannequin/generate',
      'https://api.thenewblack.ai/ghost-mannequin/generate',
      'https://api.thenewblack.ai/v1/generate',
      'https://thenewblack.ai/api/v1/ghost-mannequin/generate'
    ];

    let generationSuccess = false;
    let generatedImageUrl = null;
    let lastGenerationError = null;

    for (const endpoint of generationEndpoints) {
      try {
        console.log(`[${requestId}] 🎨 Attempting generation with endpoint: ${endpoint}`);
        
        const formData = new FormData();
        
        if (imageBlob) {
          formData.append('image', imageBlob, 'clothing.jpg');
          formData.append('mode', 'ghost_mannequin');
          formData.append('style', 'professional');
          formData.append('background', 'white');
        } else {
          const prompt = `Professional product photography of ${itemName}, ghost mannequin style, white background, studio lighting, high quality, fashion e-commerce`;
          formData.append('prompt', prompt);
          formData.append('mode', 'text_to_image');
          formData.append('style', 'ghost_mannequin');
          formData.append('background', 'white');
        }

        const genController = new AbortController();
        const genTimeout = setTimeout(() => genController.abort(), 60000);

        const generationResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
          signal: genController.signal
        });

        clearTimeout(genTimeout);

        if (generationResponse.ok) {
          const generationData = await generationResponse.json();
          
          if (generationData.image_url) {
            generatedImageUrl = generationData.image_url;
            generationSuccess = true;
            console.log(`[${requestId}] ✅ Ghost Mannequin image generated successfully with ${endpoint}`);
            break;
          } else {
            console.warn(`[${requestId}] ⚠️ No image URL in response from ${endpoint}:`, generationData);
            lastGenerationError = 'No image URL in response';
          }
        } else {
          const errorData = await generationResponse.json().catch(() => null);
          console.error(`[${requestId}] ❌ Generation failed with ${endpoint}:`, {
            status: generationResponse.status,
            error: errorData
          });
          lastGenerationError = `HTTP ${generationResponse.status}: ${errorData?.message || 'Unknown error'}`;
        }

      } catch (error) {
        console.error(`[${requestId}] ❌ Generation attempt failed with ${endpoint}:`, error.message);
        lastGenerationError = error.message;
        
        if (error.name === 'AbortError') {
          lastGenerationError = 'Generation request timed out';
        }
      }

      // Wait before trying next endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!generationSuccess || !generatedImageUrl) {
      console.error(`[${requestId}] ❌ All generation endpoints failed. Last error: ${lastGenerationError}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `TheNewBlack generation failed: ${lastGenerationError}`,
          fallbackToOpenAI: true,
          debugInfo: { 
            authDebugInfo: authResult.debugInfo,
            lastGenerationError,
            attemptedEndpoints: generationEndpoints
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Download and upload the generated image
    console.log(`[${requestId}] 📥 Downloading generated image from: ${generatedImageUrl}`);
    
    const generatedImageResponse = await fetch(generatedImageUrl);
    
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
      imageUrl: publicUrl,
      debugInfo: {
        authEndpointsAttempted: authResult.debugInfo?.attemptedEndpoints?.length || 0,
        generationEndpointsAttempted: generationEndpoints.length,
        networkConnectivity: authResult.debugInfo?.networkTests
      }
    };

    console.log(`[${requestId}] 🎉 Enhanced TheNewBlack Ghost Mannequin generation completed successfully`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

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
