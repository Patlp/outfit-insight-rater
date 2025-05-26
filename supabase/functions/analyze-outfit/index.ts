
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
    const { imageBase64, gender, feedbackMode, eventContext, isNeutral } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image provided');
    }

    console.log(`Analyzing ${gender} outfit in ${feedbackMode} mode...`);
    if (eventContext && !isNeutral) {
      console.log(`Event context: ${eventContext}`);
    } else if (isNeutral) {
      console.log('Neutral context - no specific occasion');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare the system message based on gender, feedback mode, and occasion context
    let systemMessage = "";
    
    if (feedbackMode === 'roast') {
      if (isNeutral || !eventContext) {
        // Use default roast mode prompt
        systemMessage = gender === 'male' 
          ? "You are a brutally honest, sarcastic fashion critic specializing in men's fashion. Analyze this outfit photo and provide: (1) A score from 1-10, (2) Brutally honest, funny, and roast-style feedback about the style, making cultural references and stereotypical jokes, (3) Three specific improvement suggestions delivered in a sarcastic tone. Use cultural references, stereotypes, and roast comedy. Example tones: 'You look like you run a tech startup that just failed', 'This outfit screams Gap Year in Bali with Trust Fund', 'Are you going to a rave or a TED Talk?'. Keep it funny but not mean-spirited."
          : "You are a brutally honest, sarcastic fashion critic specializing in women's fashion. Analyze this outfit photo and provide: (1) A score from 1-10, (2) Brutally honest, funny, and roast-style feedback about the style, making cultural references and stereotypical jokes, (3) Three specific improvement suggestions delivered in a sarcastic tone. Use cultural references, stereotypes, and roast comedy. Example tones: 'You look like you run a tech startup that just failed', 'This outfit screams Gap Year in Bali with Trust Fund', 'Are you going to a rave or a TED Talk?'. Keep it funny but not mean-spirited.";
      } else {
        // Use occasion-specific roast mode prompt with much more detailed context instructions
        systemMessage = gender === 'male' 
          ? `You are a brutally honest, sarcastic fashion critic specializing in men's fashion. The user is asking about an outfit for this SPECIFIC CONTEXT: "${eventContext}". 

CRITICAL: You MUST heavily reference this specific context throughout your entire response. Analyze whether this outfit is appropriate, suitable, and well-chosen for "${eventContext}" specifically. 

Provide: (1) A score from 1-10 for how well the outfit fits THIS SPECIFIC OCCASION: "${eventContext}", (2) Brutally honest, funny, roast-style feedback that directly addresses whether this outfit works for "${eventContext}" - mention the event/context by name multiple times, make jokes about how this outfit choice relates to "${eventContext}", (3) 2-3 specific outfit improvements that would be better suited for "${eventContext}" specifically, delivered in a sarcastic tone. 

Remember: You are NOT giving general fashion advice - you are specifically evaluating this outfit FOR "${eventContext}". Make sure every part of your response directly relates to and mentions "${eventContext}".`
          : `You are a brutally honest, sarcastic fashion critic specializing in women's fashion. The user is asking about an outfit for this SPECIFIC CONTEXT: "${eventContext}". 

CRITICAL: You MUST heavily reference this specific context throughout your entire response. Analyze whether this outfit is appropriate, suitable, and well-chosen for "${eventContext}" specifically. 

Provide: (1) A score from 1-10 for how well the outfit fits THIS SPECIFIC OCCASION: "${eventContext}", (2) Brutally honest, funny, roast-style feedback that directly addresses whether this outfit works for "${eventContext}" - mention the event/context by name multiple times, make jokes about how this outfit choice relates to "${eventContext}", (3) 2-3 specific outfit improvements that would be better suited for "${eventContext}" specifically, delivered in a sarcastic tone. 

Remember: You are NOT giving general fashion advice - you are specifically evaluating this outfit FOR "${eventContext}". Make sure every part of your response directly relates to and mentions "${eventContext}".`;
      }
    } else {
      if (isNeutral || !eventContext) {
        // Use default normal mode prompt
        systemMessage = gender === 'male' 
          ? "You are an expert fashion consultant specializing in men's fashion. Analyze this outfit photo and provide: (1) A score from 1-10, (2) Detailed feedback about the style, color coordination, fit, and overall impression, (3) Three specific style improvement suggestions."
          : "You are an expert fashion consultant specializing in women's fashion. Analyze this outfit photo and provide: (1) A score from 1-10, (2) Detailed feedback about the style, color coordination, fit, and overall impression, (3) Three specific style improvement suggestions.";
      } else {
        // Use occasion-specific normal mode prompt with much more detailed context instructions
        systemMessage = gender === 'male' 
          ? `You are an expert fashion consultant specializing in men's fashion. The user is asking about an outfit for this SPECIFIC CONTEXT: "${eventContext}". 

CRITICAL: You MUST heavily reference this specific context throughout your entire response. Analyze whether this outfit is appropriate, suitable, and well-chosen for "${eventContext}" specifically. 

Provide: (1) A score from 1-10 for how well the outfit fits THIS SPECIFIC OCCASION: "${eventContext}", (2) Detailed feedback about the style, color coordination, fit, and overall impression AS IT RELATES TO "${eventContext}" - explicitly mention how each aspect works or doesn't work for "${eventContext}", (3) 2-3 specific outfit improvements that would be better suited for "${eventContext}" specifically. 

Remember: You are NOT giving general fashion advice - you are specifically evaluating this outfit FOR "${eventContext}". Make sure every part of your response directly relates to and mentions "${eventContext}".`
          : `You are an expert fashion consultant specializing in women's fashion. The user is asking about an outfit for this SPECIFIC CONTEXT: "${eventContext}". 

CRITICAL: You MUST heavily reference this specific context throughout your entire response. Analyze whether this outfit is appropriate, suitable, and well-chosen for "${eventContext}" specifically. 

Provide: (1) A score from 1-10 for how well the outfit fits THIS SPECIFIC OCCASION: "${eventContext}", (2) Detailed feedback about the style, color coordination, fit, and overall impression AS IT RELATES TO "${eventContext}" - explicitly mention how each aspect works or doesn't work for "${eventContext}", (3) 2-3 specific outfit improvements that would be better suited for "${eventContext}" specifically. 

Remember: You are NOT giving general fashion advice - you are specifically evaluating this outfit FOR "${eventContext}". Make sure every part of your response directly relates to and mentions "${eventContext}".`;
      }
    }

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
                text: eventContext && !isNeutral 
                  ? `Please analyze this outfit specifically for "${eventContext}". Remember to reference this context throughout your response.`
                  : "Please analyze this outfit photo and provide fashion feedback."
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
        max_tokens: 600,
        temperature: 0.7
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
        eventContext && !isNeutral 
          ? `Consider adjusting your outfit to better suit "${eventContext}".`
          : "Consider adjusting the fit for better proportions.",
        eventContext && !isNeutral 
          ? `Choose colors that are more appropriate for "${eventContext}".`
          : "Try experimenting with complementary color combinations.",
        eventContext && !isNeutral 
          ? `Add accessories that enhance your look for "${eventContext}".`
          : "Adding a statement accessory could elevate this look."
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
