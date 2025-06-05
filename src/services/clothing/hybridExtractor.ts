
import { supabase } from '@/integrations/supabase/client';
import { extractClothingItems } from '@/utils/clothingExtractor';
import { enhancedClothingMatcher, convertToAIClothingItems } from '../enhancedClothingMatcher';
import { extractClothingPhrasesAI } from './aiExtraction';
import { convertRegexToAIFormat } from './regexConverter';
import { AIClothingItem, HybridExtractionResult, HybridExtractionResponse } from './types';

export const extractClothingPhrasesHybrid = async (
  feedback: string,
  suggestions: string[] = [],
  wardrobeItemId: string
): Promise<HybridExtractionResponse> => {
  try {
    console.log(`=== ENHANCED HYBRID CLOTHING EXTRACTION START ===`);
    console.log(`Wardrobe item: ${wardrobeItemId}`);
    console.log(`Feedback length: ${feedback.length} characters`);
    console.log(`Suggestions count: ${suggestions.length}`);

    let aiItems: AIClothingItem[] = [];
    let aiSuccess = false;
    let regexFallbackUsed = false;
    let enhancedMatchingUsed = false;

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

    // Step 2: Enhanced matching with Kaggle dataset (always run for better results)
    console.log(`Step 2: Running enhanced matching with Kaggle dataset...`);
    let enhancedItems: AIClothingItem[] = [];
    
    try {
      const fullText = [feedback, ...suggestions].join(' ');
      const enhancedMatches = await enhancedClothingMatcher(fullText, 'neutral'); // TODO: Get gender from context
      enhancedItems = convertToAIClothingItems(enhancedMatches);
      
      if (enhancedItems.length > 0) {
        enhancedMatchingUsed = true;
        console.log(`✅ Enhanced matching successful: ${enhancedItems.length} items found`);
      }
    } catch (error) {
      console.warn('Enhanced matching failed:', error);
    }

    // Step 3: Regex fallback if needed
    let regexItems: AIClothingItem[] = [];
    if (!aiSuccess && !enhancedMatchingUsed) {
      console.log(`Step 3: Triggering regex fallback extraction...`);
      regexFallbackUsed = true;
      
      const regexResults = extractClothingItems(feedback);
      console.log(`Regex extracted ${regexResults.length} raw items:`, regexResults);
      
      regexItems = await convertRegexToAIFormat(regexResults);
      console.log(`Converted to ${regexItems.length} validated items`);
    }

    // Step 4: Combine and prioritize results
    let finalItems: AIClothingItem[] = [];
    let method: 'ai' | 'regex' | 'hybrid' | 'enhanced' = 'ai';

    if (enhancedMatchingUsed && enhancedItems.length > 0) {
      // Use enhanced matching results (highest priority)
      finalItems = enhancedItems;
      method = 'enhanced';
      console.log(`Using enhanced results: ${finalItems.length} items`);
    } else if (aiSuccess && aiItems.length > 0) {
      finalItems = aiItems;
      method = 'ai';
      console.log(`Using AI results: ${finalItems.length} items`);
    } else if (regexItems.length > 0) {
      finalItems = regexItems;
      method = 'regex';
      console.log(`Using regex results: ${finalItems.length} items`);
    } else {
      console.log(`No items found from any method`);
      method = 'enhanced'; // Default method designation
    }

    // Step 5: Update wardrobe item with results
    if (finalItems.length > 0) {
      console.log(`Step 5: Updating wardrobe item with ${finalItems.length} final items...`);
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

    // Step 6: Prepare result summary
    const result: HybridExtractionResult = {
      items: finalItems,
      method,
      aiSuccess,
      regexFallbackUsed,
      enhancedMatchingUsed,
      aiItemCount: aiItems.length,
      regexItemCount: regexItems.length,
      enhancedItemCount: enhancedItems.length,
      totalItemCount: finalItems.length
    };

    console.log(`=== ENHANCED HYBRID EXTRACTION COMPLETE ===`);
    console.log(`Final method: ${method}`);
    console.log(`AI success: ${aiSuccess}`);
    console.log(`Enhanced matching used: ${enhancedMatchingUsed}`);
    console.log(`Regex fallback used: ${regexFallbackUsed}`);
    console.log(`Final item count: ${finalItems.length}`);

    return { success: true, result };

  } catch (error) {
    console.error('Error in enhanced hybrid clothing extraction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
