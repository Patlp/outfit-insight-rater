
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch fashion whitelist from database
    const { data: whitelistData, error: whitelistError } = await supabase
      .from('fashion_whitelist')
      .select('item_name, category, style_descriptors, common_materials')

    if (whitelistError) {
      console.error('Error fetching fashion whitelist:', whitelistError)
      throw new Error('Failed to fetch fashion whitelist')
    }

    // Create structured data for the AI prompt
    const whitelistForPrompt = whitelistData.map(item => ({
      name: item.item_name,
      category: item.category,
      descriptors: item.style_descriptors || [],
      materials: item.common_materials || []
    }))

    // Combine feedback and suggestions for analysis
    const fullText = [feedback, ...suggestions].join(' ')

    // Enhanced prompt using the fashion whitelist
    const prompt = `You are a fashion expert tasked with extracting clothing items from outfit descriptions. Use ONLY the items from the provided fashion whitelist below.

FASHION WHITELIST:
${JSON.stringify(whitelistForPrompt, null, 2)}

RULES:
1. Extract clothing items mentioned in the text that match items from the whitelist
2. For each item, include relevant descriptors (colors, patterns, styles, materials) mentioned in the text
3. Only use descriptors that are actually mentioned in the text or logically inferred
4. Return a maximum of 6 items
5. Format each item as: "[descriptors] [item_name]" (e.g., "black leather jacket", "blue denim jeans")
6. Do NOT create items that aren't in the whitelist
7. Return ONLY a clean JSON array of strings, no additional text

TEXT TO ANALYZE: "${fullText}"

Return a JSON array of clothing item phrases:`

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
            content: 'You are a fashion expert that extracts clothing items from text using a structured whitelist. Always respond with valid JSON arrays only.'
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
    let extractedText = openaiData.choices[0]?.message?.content?.trim()

    if (!extractedText) {
      throw new Error('No response from OpenAI')
    }

    console.log('Raw OpenAI response:', extractedText)

    // Clean up the response if it has markdown formatting
    if (extractedText.startsWith('```json')) {
      extractedText = extractedText.replace(/```json\n?/, '').replace(/\n?```$/, '')
    } else if (extractedText.startsWith('```')) {
      extractedText = extractedText.replace(/```\n?/, '').replace(/\n?```$/, '')
    }

    // Parse the JSON response
    let rawClothingPhrases: string[]
    try {
      rawClothingPhrases = JSON.parse(extractedText)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', extractedText)
      throw new Error('Invalid JSON response from OpenAI')
    }

    // Validate and clean the extracted phrases against the whitelist
    const validItems: ClothingItem[] = []
    
    for (const phrase of rawClothingPhrases) {
      if (!phrase || typeof phrase !== 'string') continue
      
      const lowerPhrase = phrase.toLowerCase().trim()
      
      // Find matching whitelist item
      const matchingWhitelistItem = whitelistData.find(item => 
        lowerPhrase.includes(item.item_name.toLowerCase())
      )
      
      if (matchingWhitelistItem) {
        // Extract descriptors from the phrase (everything before the item name)
        const itemName = matchingWhitelistItem.item_name.toLowerCase()
        const itemIndex = lowerPhrase.indexOf(itemName)
        const descriptorsPart = lowerPhrase.substring(0, itemIndex).trim()
        const descriptors = descriptorsPart ? descriptorsPart.split(/\s+/).filter(d => d.length > 0) : []
        
        validItems.push({
          name: phrase,
          descriptors: descriptors,
          category: matchingWhitelistItem.category,
          confidence: 0.9 // High confidence since we validated against whitelist
        })
      }
    }

    // Limit to 6 items and remove duplicates
    const uniqueItems = validItems
      .filter((item, index, self) => 
        index === self.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase())
      )
      .slice(0, 6)

    console.log(`Extracted ${uniqueItems.length} validated clothing items for wardrobe item ${wardrobeItemId}`)

    // Update the wardrobe item with extracted clothing phrases
    const { error: updateError } = await supabase
      .from('wardrobe_items')
      .update({ 
        extracted_clothing_items: uniqueItems,
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
        extractedItems: uniqueItems,
        count: uniqueItems.length 
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
