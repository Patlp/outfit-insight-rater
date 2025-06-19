
import { supabase } from '@/integrations/supabase/client';
import { extractClothingPhrasesAI } from '../aiExtraction';
import { extractClothingPhrasesHybrid } from '../hybridExtractor';
import { extractClothingTagsWithGoogleVision } from '../../googleVision';
import { extractFashionTagsWithVision, fileToBase64 } from '../visionTaggingService';

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
    console.log('🔍 Starting AI-powered clothing extraction for wardrobe item:', wardrobeItemId);

    // Get the original image URL from the wardrobe item
    const { data: wardrobeItem } = await supabase
      .from('wardrobe_items')
      .select('original_image_url, image_url')
      .eq('id', wardrobeItemId)
      .single();

    const originalImageUrl = wardrobeItem?.original_image_url || wardrobeItem?.image_url;
    console.log('📸 Using original image URL for extracted items:', originalImageUrl);

    // Step 1: Try OpenAI Vision Analysis (Primary Method)
    console.log('🎯 Step 1: Attempting OpenAI Vision Analysis...');
    try {
      const imageBase64 = await fileToBase64(imageFile);
      const visionResult = await extractFashionTagsWithVision(imageBase64, wardrobeItemId);
      
      if (visionResult.success && visionResult.tags && visionResult.tags.length > 0) {
        console.log('✅ OpenAI Vision Analysis successful:', visionResult.tags.length, 'tags found');
        
        // Format vision tags as clothing items with original image URL
        const visionClothingItems = visionResult.tags.map(tag => ({
          name: tag,
          descriptors: [],
          category: categorizeTag(tag),
          confidence: 0.92,
          source: 'openai-vision',
          originalImageUrl: originalImageUrl // Ensure original image URL is set
        }));

        await updateWardrobeItemWithClothing(wardrobeItemId, visionClothingItems);
        
        return {
          success: true,
          clothingItems: visionClothingItems,
          method: 'openai-vision'
        };
      }
    } catch (visionError) {
      console.warn('⚠️ OpenAI Vision Analysis failed:', visionError);
    }

    // Step 2: Try Google Vision API (Secondary Method)
    console.log('🎯 Step 2: Attempting Google Vision Analysis...');
    try {
      // First upload image to get a URL for Google Vision
      const imageUrl = await uploadImageForAnalysis(imageFile, wardrobeItemId);
      
      const googleVisionResult = await extractClothingTagsWithGoogleVision(
        imageUrl, 
        wardrobeItemId, 
        feedback, 
        suggestions
      );
      
      if (googleVisionResult.success && googleVisionResult.items && googleVisionResult.items.length > 0) {
        console.log('✅ Google Vision Analysis successful:', googleVisionResult.items.length, 'items found');
        
        // Ensure all items have original image URL
        const enhancedItems = googleVisionResult.items.map(item => ({
          ...item,
          originalImageUrl: originalImageUrl
        }));

        await updateWardrobeItemWithClothing(wardrobeItemId, enhancedItems);
        
        return {
          success: true,
          clothingItems: enhancedItems,
          method: googleVisionResult.method
        };
      }
    } catch (googleError) {
      console.warn('⚠️ Google Vision Analysis failed:', googleError);
    }

    // Step 3: Try Hybrid Text-Based Extraction (Tertiary Method)
    if (feedback) {
      console.log('🎯 Step 3: Attempting Hybrid Text-Based Extraction...');
      try {
        const hybridResult = await extractClothingPhrasesHybrid(feedback, suggestions, wardrobeItemId);
        
        if (hybridResult.success && hybridResult.result && hybridResult.result.items.length > 0) {
          console.log('✅ Hybrid Text-Based Extraction successful:', hybridResult.result.items.length, 'items found');
          
          // Ensure all items have original image URL
          const enhancedItems = hybridResult.result.items.map(item => ({
            ...item,
            originalImageUrl: originalImageUrl
          }));

          await updateWardrobeItemWithClothing(wardrobeItemId, enhancedItems);
          
          return {
            success: true,
            clothingItems: enhancedItems,
            method: hybridResult.result.method
          };
        }
      } catch (hybridError) {
        console.warn('⚠️ Hybrid Text-Based Extraction failed:', hybridError);
      }
    }

    // Step 4: Final AI Extraction Fallback
    if (feedback) {
      console.log('🎯 Step 4: Attempting Final AI Extraction Fallback...');
      try {
        const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
        
        if (aiResult.success && aiResult.extractedItems && aiResult.extractedItems.length > 0) {
          console.log('✅ Final AI Extraction successful:', aiResult.extractedItems.length, 'items found');
          
          // Ensure all items have original image URL
          const enhancedItems = aiResult.extractedItems.map(item => ({
            ...item,
            originalImageUrl: originalImageUrl
          }));

          await updateWardrobeItemWithClothing(wardrobeItemId, enhancedItems);
          
          return {
            success: true,
            clothingItems: enhancedItems,
            method: 'ai-fallback'
          };
        }
      } catch (aiError) {
        console.warn('⚠️ Final AI Extraction failed:', aiError);
      }
    }

    // All methods failed
    console.error('❌ All extraction methods failed');
    return {
      success: false,
      error: 'All clothing extraction methods failed',
      method: 'none'
    };

  } catch (error) {
    console.error('❌ Critical error in clothing extraction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown extraction error',
      method: 'error'
    };
  }
};

// Helper function to upload image for analysis services that need URLs
const uploadImageForAnalysis = async (imageFile: File, wardrobeItemId: string): Promise<string> => {
  const fileName = `analysis_${wardrobeItemId}_${Date.now()}.${imageFile.name.split('.').pop()}`;
  
  const { data, error } = await supabase.storage
    .from('outfit-images')
    .upload(fileName, imageFile, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload image for analysis: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('outfit-images')
    .getPublicUrl(data.path);

  return publicUrl;
};

// Helper function to update wardrobe item with extracted clothing
const updateWardrobeItemWithClothing = async (wardrobeItemId: string, clothingItems: any[]): Promise<void> => {
  const { error } = await supabase
    .from('wardrobe_items')
    .update({
      extracted_clothing_items: clothingItems,
      updated_at: new Date().toISOString()
    })
    .eq('id', wardrobeItemId);

  if (error) {
    throw new Error(`Failed to update wardrobe item: ${error.message}`);
  }
};

// Helper function to categorize tags based on clothing type
const categorizeTag = (tag: string): string => {
  const lowerTag = tag.toLowerCase();
  
  if (lowerTag.includes('shirt') || lowerTag.includes('blouse') || lowerTag.includes('top') || 
      lowerTag.includes('tee') || lowerTag.includes('sweater') || lowerTag.includes('cardigan') || 
      lowerTag.includes('hoodie') || lowerTag.includes('tank') || lowerTag.includes('polo')) {
    return 'tops';
  }
  
  if (lowerTag.includes('pants') || lowerTag.includes('jeans') || lowerTag.includes('trousers') || 
      lowerTag.includes('shorts') || lowerTag.includes('skirt') || lowerTag.includes('leggings')) {
    return 'bottoms';
  }
  
  if (lowerTag.includes('dress') || lowerTag.includes('gown')) {
    return 'dresses';
  }
  
  if (lowerTag.includes('jacket') || lowerTag.includes('blazer') || lowerTag.includes('coat') || 
      lowerTag.includes('vest') || lowerTag.includes('cardigan')) {
    return 'outerwear';
  }
  
  if (lowerTag.includes('shoes') || lowerTag.includes('sneakers') || lowerTag.includes('heels') || 
      lowerTag.includes('boots') || lowerTag.includes('sandals') || lowerTag.includes('flats') ||
      lowerTag.includes('loafers')) {
    return 'footwear';
  }
  
  if (lowerTag.includes('belt') || lowerTag.includes('bag') || lowerTag.includes('hat') || 
      lowerTag.includes('scarf') || lowerTag.includes('necklace') || lowerTag.includes('bracelet') || 
      lowerTag.includes('watch') || lowerTag.includes('earrings') || lowerTag.includes('sunglasses') ||
      lowerTag.includes('beanie') || lowerTag.includes('cap') || lowerTag.includes('clips')) {
    return 'accessories';
  }
  
  return 'other';
};
