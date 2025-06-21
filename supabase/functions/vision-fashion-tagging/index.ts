
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

    console.log(`Processing context-aware vision tagging for wardrobe item: ${wardrobeItemId}`);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the image for OpenAI Vision API
    const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

    const contextAwareVisionPrompt = `You are a precise fashion analysis assistant specializing in context-aware clothing identification. Analyze this outfit photo and identify each clothing item with its COMPLETE contextual description that preserves ALL visual details for accurate AI image generation.

CRITICAL CONTEXT PRESERVATION RULES:
- NEVER strip away descriptive information - preserve ALL color, style, material, and fit details
- Use COMPLETE, descriptive phrases that would help recreate the exact item
- Include texture, finish, and style details (e.g., "distressed dark wash denim jeans" not just "jeans")
- Preserve brand-style descriptors if visible (e.g., "vintage-style", "athletic-cut", "oversized")
- Include fabric appearance (e.g., "ribbed knit", "smooth cotton", "textured wool")

For each item, provide the FULL CONTEXTUAL DESCRIPTION in this format:
[Complete Descriptive Name with All Visual Details]

ENHANCED COLOR DETECTION RULES:
- Use specific fashion color terminology (not generic colors)
- For patterns, describe the dominant colors and pattern type
- Include finish descriptions (matte, glossy, faded, distressed, etc.)
- Capture undertones and color variations

SPECIFIC COLOR CATEGORIES TO USE:
* Blacks: charcoal black, jet black, faded black, matte black
* Whites: cream white, off-white, bright white, vintage white
* Grays: heather gray, light gray, charcoal gray, stone gray
* Blues: navy blue, denim blue, royal blue, powder blue, midnight blue
* Reds: burgundy red, crimson red, brick red, wine red
* Greens: forest green, olive green, sage green, emerald green
* Browns: chocolate brown, tan brown, cognac brown, camel brown
* And so forth for all colors with specific descriptive terms

CONTEXTUAL ITEM DETECTION RULES:
- Include FIT descriptors (slim-fit, relaxed-fit, oversized, fitted, etc.)
- Include STYLE descriptors (casual, formal, vintage, modern, etc.)
- Include MATERIAL appearance (cotton blend, wool knit, denim, leather, etc.)
- Include DETAILS (collared, v-neck, crew neck, button-up, zip-up, etc.)
- Maximum 6 items, but ensure each is COMPLETELY described
- One item per line with NO formatting or bullet points

EXAMPLES OF COMPLETE CONTEXTUAL DESCRIPTIONS:
- "Heather gray oversized cotton blend hoodie with kangaroo pocket"
- "Dark wash slim-fit denim jeans with slight distressing"
- "Cream white ribbed knit long-sleeve fitted turtleneck"
- "Black leather low-top sneakers with white rubber soles"
- "Burgundy wool blend crew neck pullover sweater"

Now analyze the image with complete contextual preservation for maximum AI generation accuracy:`;

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
                text: contextAwareVisionPrompt
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
        max_tokens: 400,
        temperature: 0.1 // Low temperature for consistency and accuracy
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

    // Parse the response to extract contextually rich tags
    const tags = rawContent
      .split('\n')
      .map((line: string) => line.replace(/^[-•*]\s*/, '').trim()) // Remove bullet points
      .filter((tag: string) => tag.length > 0 && !tag.toLowerCase().includes('analyze'))
      .slice(0, 6); // Limit to 6 tags max

    console.log(`Extracted ${tags.length} context-aware fashion tags:`, tags);

    const response: VisionTaggingResponse = {
      success: true,
      tags
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Context-aware vision tagging error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
