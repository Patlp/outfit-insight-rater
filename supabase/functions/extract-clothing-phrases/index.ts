

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

// Enhanced validation function for strict 2-word formatting
const validateClothingItem = (phrase: string, whitelistData: any[]): ClothingItem | null => {
  console.log(`Validating: "${phrase}"`);
  
  const lowerPhrase = phrase.toLowerCase().trim();
  const words = lowerPhrase.split(/\s+/).filter(word => word.length > 0);
  
  // STRICT RULE 1: Maximum 2 words
  if (words.length > 2) {
    console.log(`❌ Rejected "${phrase}": Too many words (${words.length} > 2)`);
    return null;
  }
  
  // STRICT RULE 2: No prepositions allowed
  const forbiddenWords = ['of', 'with', 'and', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'from', 'by', 'against'];
  const containsForbidden = words.some(word => forbiddenWords.includes(word));
  if (containsForbidden) {
    const forbiddenFound = words.filter(word => forbiddenWords.includes(word));
    console.log(`❌ Rejected "${phrase}": Contains forbidden words: ${forbiddenFound.join(', ')}`);
    return null;
  }
  
  // Find matching whitelist item
  const matchingWhitelistItem = whitelistData.find(item => 
    lowerPhrase.includes(item.item_name.toLowerCase())
  );
  
  if (!matchingWhitelistItem) {
    console.log(`❌ Rejected "${phrase}": Not in whitelist`);
    return null;
  }
  
  // Extract descriptors (everything before the item name)
  const itemName = matchingWhitelistItem.item_name.toLowerCase();
  const itemIndex = lowerPhrase.indexOf(itemName);
  const descriptorsPart = lowerPhrase.substring(0, itemIndex).trim();
  const descriptors = descriptorsPart ? descriptorsPart.split(/\s+/).filter(d => d.length > 0) : [];
  
  // STRICT RULE 3: If 2 words, first must be descriptor, second must be clothing item
  if (words.length === 2) {
    const [firstWord, secondWord] = words;
    
    // Validate that second word contains the clothing item
    if (!secondWord.includes(itemName) && !itemName.includes(secondWord)) {
      console.log(`❌ Rejected "${phrase}": Second word "${secondWord}" doesn't match clothing item "${itemName}"`);
      return null;
    }
    
    // Validate that first word is a valid descriptor
    const validDescriptors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey', 'brown', 'navy', 'beige', 'cream', 'tan', 'cotton', 'denim', 'leather', 'silk', 'wool', 'striped', 'plaid', 'fitted', 'oversized'];
    const isValidDescriptor = validDescriptors.some(desc => firstWord.includes(desc) || desc.includes(firstWord));
    
    if (!isValidDescriptor) {
      console.log(`⚠️ Warning "${phrase}": First word "${firstWord}" may not be a valid descriptor`);
    }
  } else if (words.length === 1) {
    // Single word must be the clothing item itself
    if (!words[0].includes(itemName) && !itemName.includes(words[0])) {
      console.log(`❌ Rejected "${phrase}": Single word doesn't match clothing item "${itemName}"`);
      return null;
    }
  }
  
  // Clean and format the final name
  let cleanName = phrase.trim();
  
  // Ensure proper capitalization
  const finalWords = cleanName.split(' ');
  cleanName = finalWords
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  console.log(`✅ Validated: "${phrase}" → "${cleanName}"`);
  
  return {
    name: cleanName,
    descriptors: descriptors,
    category: matchingWhitelistItem.category,
    confidence: 0.95 // High confidence for validated items
  };
};

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

    // Enhanced prompt with STRICT formatting rules
    const prompt = `You are a fashion expert tasked with extracting clothing items from outfit descriptions. Use ONLY the items from the provided fashion whitelist below.

FASHION WHITELIST:
${JSON.stringify(whitelistForPrompt, null, 2)}

STRICT RULES - FOLLOW EXACTLY:
1. Extract clothing items mentioned in the text that match items from the whitelist
2. Format MUST be: "[Color/Descriptor] [Item]" or just "[Item]" (MAX 2 WORDS)
3. NO prepositions (of, with, and, the, a, an, in, on, at, to, for, from, by, against)
4. Colors/descriptors: red, blue, black, white, cotton, denim, leather, striped, fitted, etc.
5. Return MAXIMUM 6 items
6. Only return items that are ACTUALLY mentioned in the text
7. NO combinations or styling phrases

EXAMPLES OF CORRECT FORMAT:
- "Black Jacket"
- "Denim Jeans" 
- "White Shirt"
- "Leather Shoes"
- "Jacket" (if no descriptor mentioned)

EXAMPLES OF INCORRECT FORMAT (DO NOT USE):
- "Black leather jacket" (3 words)
- "Pairing of jeans" (contains preposition)
- "Shirt and pants" (contains "and")

TEXT TO ANALYZE: "${fullText}"

Return ONLY a clean JSON array of clothing item phrases following the strict format:`

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
            content: 'You are a fashion expert that extracts clothing items using STRICT formatting rules. Always respond with valid JSON arrays only. Follow the 2-word maximum rule exactly.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.1 // Lower temperature for more consistent formatting
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

    // Apply STRICT validation to each phrase
    const validItems: ClothingItem[] = []
    
    for (const phrase of rawClothingPhrases) {
      if (!phrase || typeof phrase !== 'string') continue
      
      const validatedItem = validateClothingItem(phrase, whitelistData)
      if (validatedItem) {
        validItems.push(validatedItem)
      }
    }

    // Limit to 6 items and remove duplicates
    const uniqueItems = validItems
      .filter((item, index, self) => 
        index === self.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase())
      )
      .slice(0, 6)

    console.log(`Extracted ${uniqueItems.length} STRICTLY validated clothing items for wardrobe item ${wardrobeItemId}`)

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

