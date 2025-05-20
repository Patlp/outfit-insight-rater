
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, gender } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image provided');
    }

    console.log(`Analyzing ${gender} outfit...`);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare the system message based on gender
    const systemMessage = gender === 'male' 
      ? "You are an expert fashion consultant specializing in men's fashion. Analyze this outfit photo and provide: (1) A score from 1-10, (2) Detailed feedback about the style, color coordination, fit, and overall impression, (3) Three specific style improvement suggestions."
      : "You are an expert fashion consultant specializing in women's fashion. Analyze this outfit photo and provide: (1) A score from 1-10, (2) Detailed feedback about the style, color coordination, fit, and overall impression, (3) Three specific style improvement suggestions.";

    // Call OpenAI API with the image
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this outfit photo and provide fashion feedback."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log("AI response received");

    // Parse AI response
    let score = 7; // Default score if parsing fails
    let feedback = aiResponse;
    let suggestions = [];

    // Try to extract score (look for numbers followed by /10 or out of 10)
    const scoreMatch = aiResponse.match(/(\d+)(?:\s*\/\s*10|(?:\s+out\s+of|\s+on\s+a\s+scale\s+of)\s+10)/i);
    if (scoreMatch) {
      score = parseInt(scoreMatch[1], 10);
    }

    // Try to extract suggestions (look for numbered lists or bullet points)
    const suggestionsPattern = /(Suggestions|Improvements|Recommendations|Tips):([\s\S]+?)(?:\n\n|\n[A-Z]|$)/i;
    const suggestionsMatch = aiResponse.match(suggestionsPattern);
    
    if (suggestionsMatch) {
      const suggestionsText = suggestionsMatch[2];
      suggestions = suggestionsText
        .split(/\n[0-9]+\.|\n-|\n\*/)
        .filter(item => item.trim().length > 0)
        .map(item => item.trim())
        .slice(0, 3); // Limit to 3 suggestions
    }
    
    if (suggestions.length === 0) {
      // Fallback: try to find sentences with suggestion keywords
      const possibleSuggestions = aiResponse
        .split(/\.|\n/)
        .filter(s => 
          /suggest|try|consider|add|improve|change|update|opt for|choose|pair with/i.test(s)
        )
        .map(s => s.trim())
        .filter(s => s.length > 15);
      
      suggestions = possibleSuggestions.slice(0, 3);
    }

    // Extract feedback (everything that's not the score or suggestions)
    feedback = aiResponse.replace(/\b\d+\/10\b|\b\d+ out of 10\b|\bScore:?\s*\d+\b/g, "")
                        .replace(/(Suggestions|Improvements|Recommendations|Tips):[\s\S]+$/i, "")
                        .trim();

    // Format final result
    const result = {
      score,
      feedback,
      suggestions: suggestions.length > 0 ? suggestions : [
        "Consider adjusting the fit for better proportions.",
        "Try experimenting with complementary color combinations.",
        "Adding a statement accessory could elevate this look."
      ]
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
