import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StyleProfileRequest {
  imageBase64: string;
  gender: 'male' | 'female';
  analysisType: 'body_type' | 'color_analysis' | 'full_profile';
  existingProfile?: any;
}

interface BodyTypeAnalysis {
  bodyType: 'rectangle' | 'pear' | 'hourglass' | 'inverted_triangle' | 'undefined';
  confidence: number;
  explanation: string;
  visualShape: string;
  typicalPersonality: string;
  weightGainPattern: string[];
  stylingRecommendations: string[];
  bestFits: string[];
  recommendedFabrics: string[];
  whatNotToWear: Array<{ item: string; reason: string; }>;
}

interface ColorAnalysis {
  seasonalType: string;
  skinTone: 'fair' | 'medium' | 'olive' | 'deep';
  undertone: 'cool' | 'warm' | 'neutral';
  hairColor: string;
  eyeColor: string;
  undertoneValue: number; // 0-100
  contrastValue: number; // 0-100
  depthValue: number; // 0-100
  explanation: string;
}

interface StyleProfileResponse {
  bodyTypeAnalysis?: BodyTypeAnalysis;
  colorAnalysis?: ColorAnalysis;
  fullProfile?: any;
}

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeBodyType(imageBase64: string, gender: string): Promise<BodyTypeAnalysis> {
  const systemPrompt = `You are a professional fashion stylist and body shape analyst. Analyze the person in this image to determine their body type from these categories: rectangle, pear, hourglass, inverted_triangle, undefined.

Focus ONLY on visible body proportions and shape. Be ethical and professional.

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON. The response must start with { and end with }.

{
  "bodyType": "rectangle",
  "confidence": 0.75,
  "explanation": "Brief explanation of why this body type was chosen based on visible proportions",
  "visualShape": "Description of the silhouette",
  "typicalPersonality": "Confident and balanced",
  "weightGainPattern": ["midsection", "arms", "legs"],
  "stylingRecommendations": ["Create waist definition", "Add volume to bust and hips", "Use belts and structured pieces"],
  "bestFits": ["A-line dresses", "Wrap tops", "High-waisted bottoms"],
  "recommendedFabrics": ["Structured cotton", "Ponte knits", "Textured fabrics"],
  "whatNotToWear": [
    {"item": "boxy tops", "reason": "Adds bulk without definition"},
    {"item": "straight leg pants", "reason": "Can make silhouette appear uniform"}
  ]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this ${gender} person's body type from the image. Focus on proportions and shape. Respond with ONLY valid JSON.`
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenAI API response format');
    }

    const content = data.choices[0].message.content;
    console.log('OpenAI body type response:', content);
    
    // Try to extract JSON from response with multiple patterns
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
      if (!parsed.bodyType || !parsed.confidence || !parsed.explanation) {
        throw new Error('Missing required fields in body type analysis');
      }
      
      return parsed;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content);
      throw new Error(`Failed to parse body type analysis: ${parseError.message}`);
    }
    
  } catch (error) {
    console.error('Error in analyzeBodyType:', error);
    throw error;
  }
}

async function analyzeColorProfile(imageBase64: string, gender: string): Promise<ColorAnalysis> {
  const systemPrompt = `You are a professional color analyst. Analyze this person's natural coloring to determine their seasonal color type and characteristics.

Examine:
- Skin tone and undertones
- Hair color and highlights
- Eye color
- Natural contrast levels

Use seasonal color analysis principles to determine their type (e.g., "Light Summer", "Deep Autumn", etc.).

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON. The response must start with { and end with }.

{
  "seasonalType": "Light Summer",
  "skinTone": "fair",
  "undertone": "cool", 
  "hairColor": "Light brown with cool undertones",
  "eyeColor": "Blue-green",
  "undertoneValue": 25,
  "contrastValue": 40,
  "depthValue": 30,
  "explanation": "Detailed explanation of the seasonal type assignment based on observed features"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this ${gender} person's natural coloring for seasonal color analysis. Respond with ONLY valid JSON.`
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
              }
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenAI API response format');
    }

    const content = data.choices[0].message.content;
    console.log('OpenAI color analysis response:', content);
    
    // Try to extract JSON from response with multiple patterns
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
      if (!parsed.seasonalType || !parsed.skinTone || !parsed.undertone) {
        throw new Error('Missing required fields in color analysis');
      }
      
      return parsed;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content);
      throw new Error(`Failed to parse color analysis: ${parseError.message}`);
    }
    
  } catch (error) {
    console.error('Error in analyzeColorProfile:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: StyleProfileRequest = await req.json();
    const { imageBase64, gender, analysisType } = request;

    if (!imageBase64 || !gender || !analysisType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageBase64, gender, analysisType' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Starting ${analysisType} analysis for ${gender}`);

    let result: StyleProfileResponse = {};

    switch (analysisType) {
      case 'body_type':
        result.bodyTypeAnalysis = await analyzeBodyType(imageBase64, gender);
        break;
      
      case 'color_analysis':
        result.colorAnalysis = await analyzeColorProfile(imageBase64, gender);
        break;
      
      case 'full_profile':
        // Analyze both body type and color profile
        const [bodyType, colorProfile] = await Promise.all([
          analyzeBodyType(imageBase64, gender),
          analyzeColorProfile(imageBase64, gender)
        ]);
        result.bodyTypeAnalysis = bodyType;
        result.colorAnalysis = colorProfile;
        break;
      
      default:
        throw new Error('Invalid analysis type');
    }

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-style-profile:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});