
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

    console.log(`Processing enhanced color-aware vision tagging for wardrobe item: ${wardrobeItemId}`);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the image for OpenAI Vision API
    const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

    const enhancedColorVisionPrompt = `You are a fashion color analysis assistant. Analyze this outfit photo and identify each clothing item with its EXACT primary color.

For each item, use this EXACT format: [Primary Color] [Item Type]

COLOR DETECTION RULES:
- Be VERY specific about colors (navy blue, burgundy, cream, charcoal, emerald, etc.)
- Use common fashion color names (not generic colors like "blue" - use "navy blue", "royal blue", "sky blue")
- For patterns, identify the dominant/background color first
- For multi-colored items, pick the most prominent color
- Use these specific color categories when possible:
  * Blacks: black, charcoal, jet black, midnight black
  * Whites: white, cream, ivory, off-white, pearl white
  * Grays: light gray, dark gray, heather gray, stone gray
  * Blues: navy blue, royal blue, sky blue, powder blue, denim blue
  * Reds: burgundy, crimson, cherry red, wine red, brick red
  * Greens: forest green, olive green, emerald green, sage green
  * Browns: chocolate brown, tan, beige, camel, cognac brown
  * Pinks: blush pink, hot pink, dusty pink, rose pink
  * Purples: deep purple, lavender, plum, violet
  * Yellows: mustard yellow, golden yellow, pale yellow
  * Oranges: burnt orange, coral, peach, rust orange

ITEM DETECTION RULES:
- Only list items you can clearly see
- Use specific clothing terms (blazer, hoodie, jeans, boots, etc.)
- Maximum 6 items
- One item per line
- No bullet points or extra formatting

Examples:
Navy blue blazer
Cream silk blouse
Dark wash denim jeans
Cognac brown leather boots
Burgundy wool sweater

Now analyze the image with precise color identification:`;

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
                text: enhancedColorVisionPrompt
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
        max_tokens: 300,
        temperature: 0.1
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

    // Parse the response to extract individual tags with enhanced color information
    const tags = rawContent
      .split('\n')
      .map((line: string) => line.replace(/^[-•*]\s*/, '').trim()) // Remove bullet points
      .filter((tag: string) => tag.length > 0 && !tag.toLowerCase().includes('analyze'))
      .slice(0, 6); // Limit to 6 tags max

    console.log(`Extracted ${tags.length} color-enhanced fashion tags:`, tags);

    const response: VisionTaggingResponse = {
      success: true,
      tags
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Enhanced color vision tagging error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
