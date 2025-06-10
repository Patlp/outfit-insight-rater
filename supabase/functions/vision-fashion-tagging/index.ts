
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

    const visionPrompt = `You are a fashion tagging assistant. Analyze this outfit photo and return a list of specific clothing items and accessories that are clearly visible.

For each item, use this format: [Color] [Item Type]

Rules:
- Only list items you can clearly see in the photo
- Use specific clothing terms (blazer, hoodie, jeans, boots, etc.)
- Include the main color of each item
- Maximum 6 items
- One item per line
- No bullet points or extra formatting

Examples:
Black blazer
White shirt
Blue jeans
Brown boots

Now analyze the image:`;

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
        max_tokens: 300,
        temperature: 0.2
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
      .filter((tag: string) => tag.length > 0 && !tag.toLowerCase().includes('analyze'))
      .slice(0, 6); // Limit to 6 tags max

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
