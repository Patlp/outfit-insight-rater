
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
    const { feedback, suggestions, gender } = await req.json();
    
    if (!feedback) {
      throw new Error('No feedback provided');
    }

    console.log(`Generating product recommendations for ${gender} based on feedback...`);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create a prompt for product recommendations based on the fashion feedback
    const systemMessage = `You are a fashion product recommendation expert. Based on the provided fashion feedback and suggestions, recommend 2-3 specific fashion products that would help improve the user's style. 

    For each product recommendation, provide:
    - A specific product name (be creative but realistic)
    - A brief description explaining how it addresses the feedback
    - A realistic price range
    - The product category (e.g., "tops", "bottoms", "accessories", "shoes", "outerwear")
    - A suggested brand name (can be fictional but realistic)

    Format your response as a JSON array with this structure:
    [
      {
        "name": "Product Name",
        "description": "How this product addresses the style feedback",
        "price": "$XX.XX",
        "category": "category",
        "brand": "Brand Name"
      }
    ]

    Focus on products that directly address the style issues mentioned in the feedback and suggestions.`;

    const userMessage = `Fashion Feedback: ${feedback}\n\nStyle Suggestions: ${suggestions.join(', ')}\n\nGender: ${gender}`;

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 800,
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
    console.log("AI recommendations response received");

    // Parse AI response
    let recommendedProducts = [];
    try {
      recommendedProducts = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Fallback to empty array if parsing fails
      recommendedProducts = [];
    }

    // Transform to our Product interface format
    const recommendations = recommendedProducts.map((product: any, index: number) => ({
      id: `rec_${index + 1}`,
      name: product.name || "Recommended Fashion Item",
      description: product.description || "A great addition to your wardrobe",
      price: product.price || "$29.99",
      imageUrl: `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop&auto=format&q=80`,
      affiliateUrl: "https://sovrn.co/1oztrlh", // Using provided affiliate link for now
      brand: product.brand || "StyleCo",
      category: product.category || "fashion"
    }));

    return new Response(JSON.stringify({ recommendations }), {
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
