
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

    // Create the prompt for OpenAI
    const prompt = `
Analyze the following fashion feedback and extract clothing items with their descriptive phrases. 
Return a JSON array of clothing items, each with name, descriptors, category, and confidence score.

Categories should be one of: tops, bottoms, dresses, footwear, accessories, outerwear, other

Text to analyze: "${fullText}"

Example response format:
[
  {
    "name": "graphic tee",
    "descriptors": ["graphic", "casual", "fitted"],
    "category": "tops",
    "confidence": 0.9
  },
  {
    "name": "dark jeans",
    "descriptors": ["dark", "denim", "slim-fit"],
    "category": "bottoms", 
    "confidence": 0.85
  }
]

Focus on:
- Actual clothing items mentioned (not just colors or styles alone)
- Include descriptive adjectives that add meaning
- Assign appropriate categories
- Provide confidence scores (0-1) based on how clearly the item is described
- Limit to 6 most relevant items
- Only include items with confidence > 0.7

Return only the JSON array, no additional text.`

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
            content: 'You are a fashion expert that extracts clothing items and their descriptors from text. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
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
    let clothingItems: ClothingItem[]
    try {
      clothingItems = JSON.parse(extractedText)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', extractedText)
      throw new Error('Invalid JSON response from OpenAI')
    }

    // Validate and filter results
    const validItems = clothingItems
      .filter(item => 
        item.name && 
        item.category && 
        Array.isArray(item.descriptors) &&
        typeof item.confidence === 'number' &&
        item.confidence > 0.7
      )
      .slice(0, 6) // Limit to 6 items

    console.log(`Extracted ${validItems.length} clothing items for wardrobe item ${wardrobeItemId}`)

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
