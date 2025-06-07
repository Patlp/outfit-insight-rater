
import { supabase } from '@/integrations/supabase/client';
import { analyzeImageWithGoogleVision } from './apiClient';
import { filterClothingLabels } from './labelProcessor';
import { formatClothingTagsWithGrammar } from './tagFormatter';
import { extractClothingPhrasesAI } from '../clothing/aiExtraction';
import { AIClothingItem } from '../clothing/types';
import { validateTagStructure } from '../tagging/grammarValidation';

export const extractClothingTagsWithGoogleVision = async (
  imageUrl: string,
  wardrobeItemId: string,
  feedback?: string,
  suggestions: string[] = []
): Promise<{ success: boolean; items?: AIClothingItem[]; error?: string; method: string }> => {
  console.log('=== GOOGLE VISION TAGGING WITH GRAMMAR ENFORCEMENT ===');
  console.log(`Image URL: ${imageUrl}`);
  console.log(`Wardrobe item: ${wardrobeItemId}`);
  
  try {
    // Step 1: Analyze image with Google Vision API
    const visionResult = await analyzeImageWithGoogleVision(imageUrl);
    
    if (!visionResult.success || !visionResult.labels || visionResult.labels.length === 0) {
      console.log('Google Vision failed or returned no labels, falling back to OpenAI');
      
      if (feedback) {
        const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
        if (aiResult.success && aiResult.extractedItems) {
          // Apply grammar rules to AI results too
          const grammarValidatedItems = aiResult.extractedItems.filter(item => {
            const validation = validateTagStructure(item.name);
            return validation.isValid;
          });
          
          console.log(`OpenAI fallback with grammar validation: ${grammarValidatedItems.length} valid items`);
          return { 
            success: true, 
            items: grammarValidatedItems, 
            method: 'openai-fallback-grammar' 
          };
        }
      }
      
      return { 
        success: false, 
        error: visionResult.error || 'No labels detected and OpenAI fallback failed',
        method: 'vision-failed'
      };
    }
    
    // Step 2: Filter for clothing-related labels
    const clothingLabels = filterClothingLabels(visionResult.labels);
    console.log(`Filtered to ${clothingLabels.length} clothing-related labels for grammar processing`);
    
    if (clothingLabels.length === 0) {
      console.log('No clothing labels found, falling back to OpenAI with grammar rules');
      
      if (feedback) {
        const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
        if (aiResult.success && aiResult.extractedItems) {
          const grammarValidatedItems = aiResult.extractedItems.filter(item => {
            const validation = validateTagStructure(item.name);
            return validation.isValid;
          });
          
          return { 
            success: true, 
            items: grammarValidatedItems, 
            method: 'openai-fallback-grammar' 
          };
        }
      }
      
      return { 
        success: false, 
        error: 'No clothing items detected in image',
        method: 'no-clothing-detected'
      };
    }
    
    // Step 3: Format tags with strict grammar rules
    const grammarValidatedTags = await formatClothingTagsWithGrammar(clothingLabels);
    
    if (grammarValidatedTags.length === 0) {
      console.log('No grammar-valid tags generated, falling back to OpenAI');
      
      if (feedback) {
        const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
        if (aiResult.success && aiResult.extractedItems) {
          const grammarValidatedItems = aiResult.extractedItems.filter(item => {
            const validation = validateTagStructure(item.name);
            return validation.isValid;
          });
          
          return { 
            success: true, 
            items: grammarValidatedItems, 
            method: 'openai-fallback-grammar' 
          };
        }
      }
      
      return { 
        success: false, 
        error: 'Failed to generate grammar-valid clothing tags',
        method: 'formatting-failed'
      };
    }
    
    // Step 4: Update wardrobe item with grammar-validated results
    const { error: updateError } = await supabase
      .from('wardrobe_items')
      .update({ 
        extracted_clothing_items: grammarValidatedTags,
        updated_at: new Date().toISOString()
      })
      .eq('id', wardrobeItemId);

    if (updateError) {
      console.error('Error updating wardrobe item:', updateError);
      throw new Error('Failed to save grammar-validated tags');
    }
    
    console.log('=== GOOGLE VISION GRAMMAR TAGGING COMPLETE ===');
    console.log(`Successfully generated ${grammarValidatedTags.length} grammar-validated tags`);
    grammarValidatedTags.forEach((tag, index) => {
      const wordCount = tag.name.split(' ').length;
      console.log(`${index + 1}. "${tag.name}" (${wordCount} words, confidence: ${tag.confidence.toFixed(2)})`);
    });
    
    return { 
      success: true, 
      items: grammarValidatedTags, 
      method: 'google-vision-grammar' 
    };
    
  } catch (error) {
    console.error('Error in Google Vision grammar tagging:', error);
    
    if (feedback) {
      console.log('Attempting final OpenAI fallback with grammar rules due to error');
      try {
        const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
        if (aiResult.success && aiResult.extractedItems) {
          const grammarValidatedItems = aiResult.extractedItems.filter(item => {
            const validation = validateTagStructure(item.name);
            return validation.isValid;
          });
          
          return { 
            success: true, 
            items: grammarValidatedItems, 
            method: 'openai-fallback-error-grammar' 
          };
        }
      } catch (fallbackError) {
        console.error('OpenAI fallback with grammar also failed:', fallbackError);
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown Google Vision error',
      method: 'error'
    };
  }
};
