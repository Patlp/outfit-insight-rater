
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

// Enhanced validation function for strict 2-word formatting with primary taxonomy
const validateClothingItem = (phrase: string, primaryTaxonomy: any[], whitelistData: any[]): ClothingItem | null => {
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
  
  // PRIMARY TAXONOMY CHECK (highest priority)
  const primaryMatch = primaryTaxonomy.find(item => {
    const itemName = item.item_name.toLowerCase();
    return lowerPhrase.includes(itemName) || itemName.includes(lowerPhrase);
  });
  
  if (primaryMatch) {
    console.log(`✅ PRIMARY TAXONOMY MATCH: "${phrase}" -> "${primaryMatch.item_name}"`);
    
    // Extract descriptors
    const itemName = primaryMatch.item_name.toLowerCase();
    const itemIndex = lowerPhrase.indexOf(itemName);
    const descriptorsPart = lowerPhrase.substring(0, itemIndex).trim();
    const descriptors = descriptorsPart ? descriptorsPart.split(/\s+/).filter(d => d.length > 0) : [];
    
    // Add style descriptors from taxonomy
    if (primaryMatch.style_descriptors) {
      descriptors.push(...primaryMatch.style_descriptors);
    }
    
    return {
      name: formatItemName(phrase),
      descriptors: [...new Set(descriptors)],
      category: primaryMatch.category,
      confidence: 0.98 // High confidence for primary taxonomy matches
    };
  }
  
  // FALLBACK: Check whitelist if not in primary taxonomy
  const whitelistMatch = whitelistData.find(item => 
    lowerPhrase.includes(item.item_name.toLowerCase())
  );
  
  if (whitelistMatch) {
    console.log(`⚠️ WHITELIST FALLBACK: "${phrase}" -> "${whitelistMatch.item_name}"`);
    
    const itemName = whitelistMatch.item_name.toLowerCase();
    const itemIndex = lowerPhrase.indexOf(itemName);
    const descriptorsPart = lowerPhrase.substring(0, itemIndex).trim();
    const descriptors = descriptorsPart ? descriptorsPart.split(/\s+/).filter(d => d.length > 0) : [];
    
    return {
      name: formatItemName(phrase),
      descriptors: descriptors,
      category: whitelistMatch.category,
      confidence: 0.85 // Lower confidence for whitelist fallback
    };
  }
  
  console.log(`❌ Rejected "${phrase}": Not found in primary taxonomy or whitelist`);
  return null;
};

const formatItemName = (phrase: string): string => {
  const words = phrase.trim().split(/\s+/);
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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

    // Fetch PRIMARY TAXONOMY (highest priority)
    const { data: primaryTaxonomy, error: taxonomyError } = await supabase
      .from('primary_fashion_taxonomy')
      .select('item_name, category, style_descriptors, common_materials, priority_rank')
      .eq('is_active', true)
      .order('priority_rank', { ascending: true })
      .limit(500)

    if (taxonomyError) {
      console.error('Error fetching primary taxonomy:', taxonomyError)
      throw new Error('Failed to fetch primary taxonomy')
    }

    console.log(`PRIMARY TAXONOMY LOADED: ${primaryTaxonomy?.length || 0} items`)

    // Fetch fashion whitelist as fallback
    const { data: whitelistData, error: whitelistError } = await supabase
      .from('fashion_whitelist')
      .select('item_name, category, style_descriptors, common_materials')

    if (whitelistError) {
      console.warn('Warning: Could not fetch fashion whitelist:', whitelistError)
    }

    console.log(`WHITELIST FALLBACK: ${whitelistData?.length || 0} items`)

    // Create structured data for the AI prompt (prioritize primary taxonomy)
    const taxonomyForPrompt = (primaryTaxonomy || []).map(item => ({
      name: item.item_name,
      category: item.category,
      descriptors: item.style_descriptors || [],
      materials: item.common_materials || [],
      priority: 'PRIMARY'
    }))

    // Combine feedback and suggestions for analysis
    const fullText = [feedback, ...suggestions].join(' ')

    // Enhanced prompt with PRIMARY TAXONOMY focus
    const prompt = `You are a fashion expert tasked with extracting clothing items from outfit descriptions. Use the PRIMARY fashion taxonomy below as your main reference.

PRIMARY FASHION TAXONOMY (USE THESE FIRST):
${JSON.stringify(taxonomyForPrompt, null, 2)}

STRICT RULES - FOLLOW EXACTLY:
1. PRIORITIZE items from the PRIMARY taxonomy above
2. Format MUST be: "[Color/Descriptor] [Item]" or just "[Item]" (MAX 2 WORDS)
3. NO prepositions (of, with, and, the, a, an, in, on, at, to, for, from, by, against)
4. Colors/descriptors: red, blue, black, white, cotton, denim, leather, striped, fitted, etc.
5. Return MAXIMUM 6 items
6. Only return items that are ACTUALLY mentioned in the text
7. NO combinations or styling phrases

EXAMPLES OF CORRECT FORMAT:
- "Black Jacket" (if "jacket" is in taxonomy)
- "Denim Jeans" (if "jeans" is in taxonomy)
- "White Shirt" (if "shirt" is in taxonomy)
- "Jacket" (if no descriptor mentioned)

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
            content: 'You are a fashion expert that extracts clothing items using STRICT formatting rules and PRIMARY taxonomy prioritization. Always respond with valid JSON arrays only. Follow the 2-word maximum rule exactly.'
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

    // Apply STRICT validation with PRIMARY TAXONOMY priority
    const validItems: ClothingItem[] = []
    
    for (const phrase of rawClothingPhrases) {
      if (!phrase || typeof phrase !== 'string') continue
      
      const validatedItem = validateClothingItem(phrase, primaryTaxonomy || [], whitelistData || [])
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
    console.log(`Primary taxonomy matches: ${uniqueItems.filter(item => item.confidence >= 0.95).length}`)

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
        count: uniqueItems.length,
        primaryTaxonomyUsed: primaryTaxonomy?.length || 0
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
