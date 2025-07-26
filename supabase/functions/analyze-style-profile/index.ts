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

Respond with this exact JSON structure:
{
  "bodyType": "one of: rectangle, pear, hourglass, inverted_triangle, undefined",
  "confidence": 0.0-1.0,
  "explanation": "Brief explanation of why this body type was chosen based on visible proportions",
  "visualShape": "Description of the silhouette",
  "typicalPersonality": "Positive archetype associated with this body type (confident, creative, practical, etc.)",
  "weightGainPattern": ["area1", "area2", "area3"],
  "stylingRecommendations": ["tip1", "tip2", "tip3"],
  "bestFits": ["fit1", "fit2", "fit3"],
  "recommendedFabrics": ["fabric1", "fabric2", "fabric3"],
  "whatNotToWear": [
    {"item": "clothing item", "reason": "why to avoid"},
    {"item": "clothing item", "reason": "why to avoid"}
  ]
}`;

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
              text: `Please analyze this ${gender} person's body type from the image. Focus on proportions and shape.`
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

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('Failed to parse body type analysis');
}

async function analyzeColorProfile(imageBase64: string, gender: string): Promise<ColorAnalysis> {
  const systemPrompt = `You are a professional color analyst. Analyze this person's natural coloring to determine their seasonal color type and characteristics.

Examine:
- Skin tone and undertones
- Hair color and highlights
- Eye color
- Natural contrast levels

Use seasonal color analysis principles to determine their type (e.g., "Light Summer", "Deep Autumn", etc.).

Respond with this exact JSON structure:
{
  "seasonalType": "Seasonal color type (e.g., Light Summer, Deep Autumn)",
  "skinTone": "fair, medium, olive, or deep",
  "undertone": "cool, warm, or neutral", 
  "hairColor": "Descriptive hair color",
  "eyeColor": "Descriptive eye color",
  "undertoneValue": 0-100 (0=very cool, 100=very warm),
  "contrastValue": 0-100 (0=low contrast, 100=high contrast),
  "depthValue": 0-100 (0=very light, 100=very deep),
  "explanation": "Detailed explanation of the seasonal type assignment based on observed features"
}`;

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
              text: `Please analyze this ${gender} person's natural coloring for seasonal color analysis.`
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

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('Failed to parse color analysis');
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