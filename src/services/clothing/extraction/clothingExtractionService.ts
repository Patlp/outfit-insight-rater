
import { supabase } from '@/integrations/supabase/client';
import { extractClothingPhrasesAI } from '../aiExtraction';
import { extractClothingPhrasesHybrid } from '../hybridExtractor';
import { extractClothingTagsWithGoogleVision } from '../../googleVision';
import { extractFashionTagsWithVision, fileToBase64 } from '../visionTaggingService';
import { extractAndPreserveColorContext } from './colorExtraction';
import { generateContextAwarePrompt } from './promptGeneration';
import { categorizeTag } from './categoryMapping';
import { uploadImageForAnalysis, updateWardrobeItemWithClothing, getWardrobeItemImageUrl } from './imageUtils';

interface ExtractionResult {
  success: boolean;
  clothingItems?: any[];
  error?: string;
  method?: string;
}

export const extractClothingFromImage = async (
  imageFile: File,
  wardrobeItemId: string,
  feedback?: string,
  suggestions: string[] = []
): Promise<ExtractionResult> => {
  try {
    console.log('🔍 Starting context-aware clothing extraction with preserved color analysis for wardrobe item:', wardrobeItemId);

    // Get the original image URL from the wardrobe item
    const originalImageUrl = await getWardrobeItemImageUrl(wardrobeItemId);
    console.log('📸 Using original image URL for context-aware generation:', originalImageUrl);

    // Step 1: Try Enhanced OpenAI Vision Analysis with Context Preservation (Primary Method)
    console.log('🎯 Step 1: Attempting Enhanced OpenAI Vision Analysis with Context Preservation...');
    try {
      const imageBase64 = await fileToBase64(imageFile);
      const visionResult = await extractFashionTagsWithVision(imageBase64, wardrobeItemId);
      
      if (visionResult.success && visionResult.tags && visionResult.tags.length > 0) {
        console.log('✅ Enhanced OpenAI Vision Analysis successful:', visionResult.tags.length, 'context-aware tags found');
        
        // Format vision tags as clothing items with PRESERVED context
        const contextAwareClothingItems = visionResult.tags.map(tag => {
          const colorResult = extractAndPreserveColorContext(tag);
          const category = categorizeTag(colorResult.cleanItemName);
          const contextPrompt = generateContextAwarePrompt(tag, category, originalImageUrl);
          
          return {
            name: colorResult.preservedName, // PRESERVE ORIGINAL NAME WITH COLOR
            cleanName: colorResult.cleanItemName, // Clean name for categorization
            primaryColor: colorResult.extractedColor,
            colorConfidence: colorResult.colorConfidence,
            fullDescription: colorResult.fullDescription,
            contextAwarePrompt: contextPrompt, // Store the full context-aware prompt
            descriptors: [colorResult.extractedColor].filter(d => d && d !== 'neutral'),
            category: category,
            confidence: 0.95, // Higher confidence for context-aware extraction
            source: 'openai-vision-context-aware',
            originalImageUrl: originalImageUrl,
            colorPreserved: true,
            contextAware: true,
            extractionTimestamp: new Date().toISOString()
          };
        });

        await updateWardrobeItemWithClothing(wardrobeItemId, contextAwareClothingItems);
        
        return {
          success: true,
          clothingItems: contextAwareClothingItems,
          method: 'openai-vision-context-preserved'
        };
      }
    } catch (visionError) {
      console.warn('⚠️ Enhanced OpenAI Vision Analysis failed:', visionError);
    }

    // Step 2: Try Google Vision API with Context Enhancement (Secondary Method)
    console.log('🎯 Step 2: Attempting Google Vision Analysis with Context Enhancement...');
    try {
      const imageUrl = await uploadImageForAnalysis(imageFile, wardrobeItemId);
      
      const googleVisionResult = await extractClothingTagsWithGoogleVision(
        imageUrl, 
        wardrobeItemId, 
        feedback, 
        suggestions
      );
      
      if (googleVisionResult.success && googleVisionResult.items && googleVisionResult.items.length > 0) {
        console.log('✅ Google Vision Analysis with context enhancement successful:', googleVisionResult.items.length, 'items found');
        
        // Enhance Google Vision results with context preservation
        const contextEnhancedItems = googleVisionResult.items.map(item => {
          const colorResult = extractAndPreserveColorContext(item.name);
          const category = categorizeTag(colorResult.cleanItemName);
          const contextPrompt = generateContextAwarePrompt(item.name, category, originalImageUrl);
          
          return {
            ...item,
            name: colorResult.preservedName, // PRESERVE ORIGINAL CONTEXT
            cleanName: colorResult.cleanItemName,
            primaryColor: colorResult.extractedColor,
            colorConfidence: colorResult.colorConfidence,
            contextAwarePrompt: contextPrompt,
            originalImageUrl: originalImageUrl,
            colorPreserved: true,
            contextAware: true,
            descriptors: [...(item.descriptors || []), colorResult.extractedColor].filter(d => d && d !== 'neutral')
          };
        });

        await updateWardrobeItemWithClothing(wardrobeItemId, contextEnhancedItems);
        
        return {
          success: true,
          clothingItems: contextEnhancedItems,
          method: googleVisionResult.method + '-context-enhanced'
        };
      }
    } catch (googleError) {
      console.warn('⚠️ Google Vision Analysis failed:', googleError);
    }

    // Step 3: Try Hybrid Text-Based Extraction with Context Enhancement (Tertiary Method)
    if (feedback) {
      console.log('🎯 Step 3: Attempting Hybrid Text-Based Extraction with Context Enhancement...');
      try {
        const hybridResult = await extractClothingPhrasesHybrid(feedback, suggestions, wardrobeItemId);
        
        if (hybridResult.success && hybridResult.result && hybridResult.result.items.length > 0) {
          console.log('✅ Hybrid Text-Based Extraction with context enhancement successful:', hybridResult.result.items.length, 'items found');
          
          // Enhance hybrid results with context preservation
          const contextEnhancedItems = hybridResult.result.items.map(item => {
            const colorResult = extractAndPreserveColorContext(item.name);
            const category = categorizeTag(colorResult.cleanItemName);
            const contextPrompt = generateContextAwarePrompt(item.name, category, originalImageUrl);
            
            return {
              ...item,
              name: colorResult.preservedName, // PRESERVE ORIGINAL CONTEXT
              cleanName: colorResult.cleanItemName,
              primaryColor: colorResult.extractedColor,
              colorConfidence: colorResult.colorConfidence,
              contextAwarePrompt: contextPrompt,
              originalImageUrl: originalImageUrl,
              colorPreserved: true,
              contextAware: true,
              descriptors: [...(item.descriptors || []), colorResult.extractedColor].filter(d => d && d !== 'neutral')
            };
          });

          await updateWardrobeItemWithClothing(wardrobeItemId, contextEnhancedItems);
          
          return {
            success: true,
            clothingItems: contextEnhancedItems,
            method: hybridResult.result.method + '-context-enhanced'
          };
        }
      } catch (hybridError) {
        console.warn('⚠️ Hybrid Text-Based Extraction failed:', hybridError);
      }
    }

    // Step 4: Final AI Extraction Fallback with Context Enhancement
    if (feedback) {
      console.log('🎯 Step 4: Attempting Final AI Extraction Fallback with Context Enhancement...');
      try {
        const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
        
        if (aiResult.success && aiResult.extractedItems && aiResult.extractedItems.length > 0) {
          console.log('✅ Final AI Extraction with context enhancement successful:', aiResult.extractedItems.length, 'items found');
          
          // Enhance AI results with context preservation
          const contextEnhancedItems = aiResult.extractedItems.map(item => {
            const colorResult = extractAndPreserveColorContext(item.name);
            const category = categorizeTag(colorResult.cleanItemName);
            const contextPrompt = generateContextAwarePrompt(item.name, category, originalImageUrl);
            
            return {
              ...item,
              name: colorResult.preservedName, // PRESERVE ORIGINAL CONTEXT
              cleanName: colorResult.cleanItemName,
              primaryColor: colorResult.extractedColor,
              colorConfidence: colorResult.colorConfidence,
              contextAwarePrompt: contextPrompt,
              originalImageUrl: originalImageUrl,
              colorPreserved: true,
              contextAware: true,
              descriptors: [...(item.descriptors || []), colorResult.extractedColor].filter(d => d && d !== 'neutral')
            };
          });

          await updateWardrobeItemWithClothing(wardrobeItemId, contextEnhancedItems);
          
          return {
            success: true,
            clothingItems: contextEnhancedItems,
            method: 'ai-fallback-context-enhanced'
          };
        }
      } catch (aiError) {
        console.warn('⚠️ Final AI Extraction failed:', aiError);
      }
    }

    // All methods failed
    console.error('❌ All context-aware extraction methods failed');
    return {
      success: false,
      error: 'All clothing extraction methods failed',
      method: 'none'
    };

  } catch (error) {
    console.error('❌ Critical error in context-aware clothing extraction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown extraction error',
      method: 'error'
    };
  }
};
