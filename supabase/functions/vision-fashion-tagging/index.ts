
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisionTaggingRequest {
  imageBase64: string;
  wardrobeItemId: string;
}

interface VisionTaggingResponse {
  success: boolean;
  tags: string[];
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, wardrobeItemId }: VisionTaggingRequest = await req.json();

    if (!imageBase64 || !wardrobeItemId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing vision tagging for wardrobe item: ${wardrobeItemId}`);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the image for OpenAI Vision API
    const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

    const visionPrompt = `You are a fashion tagging assistant. The user has uploaded an image of a person wearing an outfit. Analyze the photo and return a list of short, clear clothing and accessory descriptions, each written in this format:

[Color] [Material if visible] [Type] [Pattern or Graphic if relevant]

Only list visible clothing and accessories. Omit brand names unless part of a graphic. Use clear, common fashion terms (e.g., "graphic tee", "plaid shirt", "denim skirt", "striped socks"). Each item should be a short, self-contained phrase.

Examples of valid outputs:
- Black graphic flame tee  
- Light blue denim skirt  
- Pink cat print beanie  
- Red plaid shirt  
- White hair clips

Now analyze the image and return the list of items as short labels, one per line.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: visionPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to analyze image with OpenAI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    const rawContent = openaiData.choices[0].message.content;

    // Parse the response to extract individual tags
    const tags = rawContent
      .split('\n')
      .map((line: string) => line.replace(/^[-•*]\s*/, '').trim()) // Remove bullet points
      .filter((tag: string) => tag.length > 0 && !tag.toLowerCase().includes('analyze') && !tag.toLowerCase().includes('image'))
      .slice(0, 8); // Limit to 8 tags max

    console.log(`Extracted ${tags.length} fashion tags:`, tags);

    const response: VisionTaggingResponse = {
      success: true,
      tags
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Vision tagging error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
