import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaletteRequest {
  seasonalType: string;
  bodyType: string;
  skinTone: string;
  undertone: string;
  gender: 'male' | 'female';
}

interface CategoryRecommendation {
  category: string;
  colors: string[];
  explanation: string;
  specificAdvice: string[];
}

interface ColorPaletteResponse {
  categoryRecommendations: CategoryRecommendation[];
  overallExplanation: string;
}

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

async function generateColorPalette(request: PaletteRequest): Promise<ColorPaletteResponse> {
  const { seasonalType, bodyType, skinTone, undertone, gender } = request;

  const systemPrompt = `You are a professional color consultant and fashion stylist. Generate a comprehensive color palette for this person based on their analyzed features.

Person Profile:
- Seasonal Type: ${seasonalType}
- Body Type: ${bodyType}
- Skin Tone: ${skinTone}
- Undertone: ${undertone}
- Gender: ${gender}

Create personalized color recommendations for each clothing category, considering:
1. How colors interact with their skin tone and undertones
2. Strategic color placement based on body type
3. Fashion principles for flattering color coordination

For body type considerations:
- Pear: Lighter/brighter colors on top, darker colors on bottom
- Inverted Triangle: Darker colors on top, lighter colors on bottom  
- Rectangle: Colors that create curves and definition
- Hourglass: Colors that maintain balance
- Undefined: Versatile colors that enhance natural features

Respond with this exact JSON structure:
{
  "categoryRecommendations": [
    {
      "category": "Tops & Blouses",
      "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5", "#hex6"],
      "explanation": "Why these colors work for this person's skin tone near the face",
      "specificAdvice": ["styling tip 1", "styling tip 2", "styling tip 3"]
    },
    {
      "category": "Bottoms",
      "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5", "#hex6"],
      "explanation": "Why these colors balance their proportions",
      "specificAdvice": ["styling tip 1", "styling tip 2", "styling tip 3"]
    },
    {
      "category": "Outerwear",
      "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5", "#hex6"],
      "explanation": "Why these colors complement their seasonal type",
      "specificAdvice": ["styling tip 1", "styling tip 2", "styling tip 3"]
    },
    {
      "category": "Footwear",
      "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5", "#hex6"],
      "explanation": "Why these colors ground the outfit and complement style",
      "specificAdvice": ["styling tip 1", "styling tip 2", "styling tip 3"]
    },
    {
      "category": "Accessories & Jewelry",
      "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5", "#hex6"],
      "explanation": "Why these metal tones and accent colors enhance natural features",
      "specificAdvice": ["styling tip 1", "styling tip 2", "styling tip 3"]
    }
  ],
  "overallExplanation": "Comprehensive explanation of how this palette works with their unique features and body type"
}

Ensure all hex codes are valid 6-digit hex colors (e.g., #FF6B9D).`;

    console.log('Generating color palette with OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Generate a personalized color palette for this ${gender} with ${seasonalType} coloring, ${bodyType} body type, ${skinTone} skin with ${undertone} undertones.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.4,
      }),
    });

    console.log('OpenAI request sent, awaiting response...');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error details:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenAI API response format');
    }

    const content = data.choices[0].message.content;
    console.log('OpenAI palette response received:', content.substring(0, 200) + '...');
  
    // Extract JSON from response with improved parsing
    let jsonStr = content.trim();
    
    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```json\s*|\s*```/g, '');
    
    // Extract JSON object from text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    try {
      const parsed = JSON.parse(jsonStr);
      
      // Validate required fields
      if (!parsed.categoryRecommendations || !Array.isArray(parsed.categoryRecommendations)) {
        throw new Error('Missing or invalid categoryRecommendations in palette response');
      }
      
      console.log('Successfully parsed color palette with', parsed.categoryRecommendations.length, 'categories');
      return parsed;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content);
      throw new Error(`Failed to parse color palette: ${parseError.message}`);
    }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error('OpenAI API key is not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const request: PaletteRequest = await req.json();
    
    if (!request.seasonalType || !request.bodyType || !request.skinTone || !request.undertone || !request.gender) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Generating color palette for:', request);
    
    const palette = await generateColorPalette(request);

    return new Response(
      JSON.stringify(palette),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-style-palette:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});