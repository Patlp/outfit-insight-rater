
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClothingExtractionRequest {
  feedback: string;
  suggestions?: string[];
  wardrobeItemId: string;
}

interface ClothingItem {
  name: string;
  descriptors: string[];
  category: string;
  confidence: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { feedback, suggestions = [], wardrobeItemId }: ClothingExtractionRequest = await req.json()

    if (!feedback || !wardrobeItemId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: feedback and wardrobeItemId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Combine feedback and suggestions for analysis
    const fullText = [feedback, ...suggestions].join(' ')

    // New improved prompt for clean clothing phrase extraction
    const prompt = `You are a clothing item extractor. Given a paragraph describing an outfit, extract a list of physical clothing items mentioned. Format each item as a short phrase with one or two adjectives followed by a noun (e.g. "yellow graphic tee").

Rules:
• Each item must describe an actual clothing or accessory item.
• Format: "[adjective] [clothing noun]" or "[adjective] [adjective] [clothing noun]"
• DO NOT include:
  • Phrases with verbs (e.g. "layering", "balancing", "featuring")
  • Commentary (e.g. "mix of casual elements")
  • Words like "with", "and", "style", or "elements"
• Limit output to 3–6 items only.
• Return result as a clean JSON array of strings.

Text to analyze: "${fullText}"

Return only a JSON array of clothing item phrases, no additional text.`

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a clothing item extractor that returns clean JSON arrays of clothing phrases. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.2
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const extractedText = openaiData.choices[0]?.message?.content?.trim()

    if (!extractedText) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    let rawClothingPhrases: string[]
    try {
      rawClothingPhrases = JSON.parse(extractedText)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', extractedText)
      throw new Error('Invalid JSON response from OpenAI')
    }

    // Post-filter logic to ensure clean phrases
    const clothingNounWhitelist = [
      "tee", "shirt", "skirt", "pants", "jeans", "jacket", "coat",
      "socks", "shoes", "sneakers", "boots", "hoodie", "sweater",
      "blazer", "beanie", "hat", "shorts", "top", "turtleneck",
      "dress", "cardigan", "vest", "flannel", "polo", "tank"
    ];

    const bannedWords = ["with", "and", "style", "elements", "layering", "balancing", "mix", "featuring"];

    const cleanedPhrases = rawClothingPhrases
      .filter(phrase => {
        if (!phrase || typeof phrase !== 'string') return false;
        
        const lowerPhrase = phrase.toLowerCase().trim();
        
        // Remove phrases with banned words
        if (bannedWords.some(word => lowerPhrase.includes(word))) return false;
        
        // Remove phrases with more than 4 words
        if (lowerPhrase.split(' ').length > 4) return false;
        
        // Check if last word is a valid clothing noun
        const words = lowerPhrase.split(' ');
        const lastWord = words[words.length - 1];
        if (!clothingNounWhitelist.includes(lastWord)) return false;
        
        return true;
      })
      .slice(0, 6); // Limit to 6 items max

    // Convert cleaned phrases to the expected ClothingItem format
    const validItems: ClothingItem[] = cleanedPhrases.map(phrase => {
      const words = phrase.toLowerCase().split(' ');
      const clothingNoun = words[words.length - 1];
      const descriptors = words.slice(0, -1);
      
      // Determine category based on clothing noun
      const getCategory = (noun: string): string => {
        if (['tee', 'shirt', 'hoodie', 'sweater', 'blazer', 'top', 'tank', 'polo', 'flannel', 'cardigan', 'vest'].includes(noun)) return 'tops';
        if (['skirt', 'pants', 'jeans', 'shorts'].includes(noun)) return 'bottoms';
        if (['dress'].includes(noun)) return 'dresses';
        if (['shoes', 'sneakers', 'boots'].includes(noun)) return 'footwear';
        if (['jacket', 'coat'].includes(noun)) return 'outerwear';
        if (['socks', 'beanie', 'hat'].includes(noun)) return 'accessories';
        return 'other';
      };

      return {
        name: phrase,
        descriptors: descriptors,
        category: getCategory(clothingNoun),
        confidence: 0.85 // High confidence since we've filtered thoroughly
      };
    });

    console.log(`Extracted ${validItems.length} clean clothing items for wardrobe item ${wardrobeItemId}`);

    // Update the wardrobe item with extracted clothing phrases
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error: updateError } = await supabase
      .from('wardrobe_items')
      .update({ 
        extracted_clothing_items: validItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', wardrobeItemId)

    if (updateError) {
      console.error('Error updating wardrobe item:', updateError)
      throw new Error('Failed to save extracted clothing items')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        extractedItems: validItems,
        count: validItems.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in extract-clothing-phrases function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
