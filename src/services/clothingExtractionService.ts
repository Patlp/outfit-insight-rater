import { supabase } from '@/integrations/supabase/client';
import { extractClothingItems, categorizeClothingItem } from '@/utils/clothingExtractor';
import { getFashionWhitelist } from './fashionWhitelistService';

export interface AIClothingItem {
  name: string;
  descriptors: string[];
  category: string;
  confidence: number;
  [key: string]: any; // Add index signature to make it compatible with Json type
}

export interface HybridExtractionResult {
  items: AIClothingItem[];
  method: 'ai' | 'regex' | 'hybrid';
  aiSuccess: boolean;
  regexFallbackUsed: boolean;
  aiItemCount: number;
  regexItemCount: number;
  totalItemCount: number;
}

export const extractClothingPhrasesHybrid = async (
  feedback: string,
  suggestions: string[] = [],
  wardrobeItemId: string
): Promise<{ success: boolean; result?: HybridExtractionResult; error?: string }> => {
  try {
    console.log(`=== HYBRID CLOTHING EXTRACTION START ===`);
    console.log(`Wardrobe item: ${wardrobeItemId}`);
    console.log(`Feedback length: ${feedback.length} characters`);
    console.log(`Suggestions count: ${suggestions.length}`);

    let aiItems: AIClothingItem[] = [];
    let aiSuccess = false;
    let regexFallbackUsed = false;

    // Step 1: Try AI extraction first
    console.log(`Step 1: Attempting AI extraction...`);
    const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
    
    if (aiResult.success && aiResult.extractedItems && aiResult.extractedItems.length > 0) {
      aiItems = aiResult.extractedItems;
      aiSuccess = true;
      console.log(`✅ AI extraction successful: ${aiItems.length} items found`);
    } else {
      console.log(`❌ AI extraction failed or returned 0 items`);
      if (aiResult.error) {
        console.log(`AI error: ${aiResult.error}`);
      }
    }

    // Step 2: Determine if we need regex fallback
    let regexItems: AIClothingItem[] = [];
    if (!aiSuccess || aiItems.length === 0) {
      console.log(`Step 2: Triggering regex fallback extraction...`);
      regexFallbackUsed = true;
      
      // Extract using regex
      const regexResults = extractClothingItems(feedback);
      console.log(`Regex extracted ${regexResults.length} raw items:`, regexResults);
      
      // Convert regex results to AIClothingItem format and cross-reference with whitelist
      regexItems = await convertRegexToAIFormat(regexResults);
      console.log(`Converted to ${regexItems.length} validated items`);
    }

    // Step 3: Combine results and determine final method
    let finalItems: AIClothingItem[] = [];
    let method: 'ai' | 'regex' | 'hybrid' = 'ai';

    if (aiSuccess && aiItems.length > 0) {
      finalItems = aiItems;
      method = 'ai';
      console.log(`Using AI results: ${finalItems.length} items`);
    } else if (regexItems.length > 0) {
      finalItems = regexItems;
      method = 'regex';
      console.log(`Using regex results: ${finalItems.length} items`);
    } else {
      console.log(`No items found from either method`);
      method = 'ai'; // Default method designation
    }

    // Step 4: Update wardrobe item with results
    if (finalItems.length > 0) {
      console.log(`Step 4: Updating wardrobe item with ${finalItems.length} final items...`);
      const { error: updateError } = await supabase
        .from('wardrobe_items')
        .update({ 
          extracted_clothing_items: finalItems,
          updated_at: new Date().toISOString()
        })
        .eq('id', wardrobeItemId);

      if (updateError) {
        console.error('Error updating wardrobe item:', updateError);
        throw new Error('Failed to save extracted clothing items');
      }
    }

    // Step 5: Prepare result summary
    const result: HybridExtractionResult = {
      items: finalItems,
      method,
      aiSuccess,
      regexFallbackUsed,
      aiItemCount: aiItems.length,
      regexItemCount: regexItems.length,
      totalItemCount: finalItems.length
    };

    console.log(`=== HYBRID EXTRACTION COMPLETE ===`);
    console.log(`Final method: ${method}`);
    console.log(`AI success: ${aiSuccess}`);
    console.log(`Regex fallback used: ${regexFallbackUsed}`);
    console.log(`Final item count: ${finalItems.length}`);

    return { success: true, result };

  } catch (error) {
    console.error('Error in hybrid clothing extraction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

const convertRegexToAIFormat = async (regexItems: string[]): Promise<AIClothingItem[]> => {
  console.log(`Converting ${regexItems.length} regex items to AI format...`);
  
  try {
    // Get the fashion whitelist for validation
    const { data: whitelistData, error } = await getFashionWhitelist();
    if (error || !whitelistData) {
      console.warn('Could not fetch fashion whitelist, using basic conversion');
      // Fallback to basic conversion without whitelist validation
      return regexItems.map(item => ({
        name: item,
        descriptors: [],
        category: categorizeClothingItem(item),
        confidence: 0.7 // Medium confidence for regex-based extraction
      }));
    }

    const validatedItems: AIClothingItem[] = [];

    for (const regexItem of regexItems) {
      const lowerItem = regexItem.toLowerCase();
      
      // Find matching whitelist item
      const matchingWhitelistItem = whitelistData.find(whitelistItem => 
        lowerItem.includes(whitelistItem.item_name.toLowerCase()) ||
        whitelistItem.item_name.toLowerCase().includes(lowerItem)
      );

      if (matchingWhitelistItem) {
        // Extract descriptors (words before the main item name)
        const itemName = matchingWhitelistItem.item_name.toLowerCase();
        const itemIndex = lowerItem.indexOf(itemName);
        const descriptorsPart = itemIndex > 0 ? lowerItem.substring(0, itemIndex).trim() : '';
        const descriptors = descriptorsPart ? descriptorsPart.split(/\s+/).filter(d => d.length > 0) : [];

        validatedItems.push({
          name: regexItem, // Keep original formatting
          descriptors: descriptors,
          category: matchingWhitelistItem.category,
          confidence: 0.8 // High confidence since validated against whitelist
        });
      } else {
        // Item not in whitelist, use basic categorization
        validatedItems.push({
          name: regexItem,
          descriptors: [],
          category: categorizeClothingItem(regexItem),
          confidence: 0.6 // Lower confidence for non-whitelist items
        });
      }
    }

    console.log(`Validated ${validatedItems.length} items against whitelist`);
    return validatedItems.slice(0, 6); // Limit to 6 items

  } catch (error) {
    console.error('Error converting regex items:', error);
    // Fallback to basic conversion
    return regexItems.map(item => ({
      name: item,
      descriptors: [],
      category: categorizeClothingItem(item),
      confidence: 0.7
    }));
  }
};

// Keep the original AI extraction function for direct calls
export const extractClothingPhrasesAI = async (
  feedback: string,
  suggestions: string[] = [],
  wardrobeItemId: string
): Promise<{ success: boolean; extractedItems?: AIClothingItem[]; error?: string }> => {
  try {
    console.log(`Starting AI clothing extraction for wardrobe item: ${wardrobeItemId}`);

    const { data, error } = await supabase.functions.invoke('extract-clothing-phrases', {
      body: {
        feedback,
        suggestions,
        wardrobeItemId
      }
    });

    if (error) {
      console.error('Error calling extract-clothing-phrases function:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to extract clothing phrases' 
      };
    }

    if (!data.success) {
      console.error('Function returned error:', data.error);
      return { 
        success: false, 
        error: data.error || 'Unknown error during extraction' 
      };
    }

    console.log(`Successfully extracted ${data.count} clothing items`);
    return { 
      success: true, 
      extractedItems: data.extractedItems 
    };

  } catch (error) {
    console.error('Service error during clothing extraction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const getExtractedClothingItems = async (wardrobeItemId: string): Promise<AIClothingItem[] | null> => {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items')
      .eq('id', wardrobeItemId)
      .single();

    if (error) {
      console.error('Error fetching extracted clothing items:', error);
      return null;
    }

    // Properly handle the JSON type and validate it's an array of AIClothingItem
    const extractedItems = data?.extracted_clothing_items;
    
    if (!extractedItems || !Array.isArray(extractedItems)) {
      return null;
    }

    // Cast to unknown[] first to avoid direct type assertion issues
    const unknownItems = extractedItems as unknown[];

    // Type guard to ensure each item has the required properties
    const isValidAIClothingItem = (item: unknown): item is AIClothingItem => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof (item as any).name === 'string' &&
        Array.isArray((item as any).descriptors) &&
        typeof (item as any).category === 'string' &&
        typeof (item as any).confidence === 'number'
      );
    };

    // Filter and validate the items with explicit type narrowing
    const validItems: AIClothingItem[] = [];
    for (const item of unknownItems) {
      if (isValidAIClothingItem(item)) {
        validItems.push(item);
      }
    }
    
    return validItems.length > 0 ? validItems : null;
  } catch (error) {
    console.error('Error in getExtractedClothingItems:', error);
    return null;
  }
};
