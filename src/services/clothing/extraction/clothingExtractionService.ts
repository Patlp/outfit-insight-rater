
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

interface ColorExtractionResult {
  primaryColor: string;
  colorConfidence: number;
  itemName: string;
}

// Enhanced color extraction function
const extractColorFromItemName = (itemName: string): ColorExtractionResult => {
  const name = itemName.toLowerCase();
  
  // Define comprehensive color mapping with fashion-specific terms
  const colorPatterns = {
    // Blacks
    'black': ['black', 'jet black', 'midnight black'],
    'charcoal': ['charcoal', 'dark gray', 'anthracite'],
    
    // Whites
    'white': ['white', 'pure white'],
    'cream': ['cream', 'ivory', 'off-white', 'pearl white', 'eggshell'],
    
    // Blues
    'navy blue': ['navy', 'navy blue', 'dark blue'],
    'royal blue': ['royal blue', 'cobalt blue'],
    'sky blue': ['sky blue', 'light blue', 'powder blue'],
    'denim blue': ['denim', 'denim blue', 'jean blue'],
    
    // Reds
    'burgundy': ['burgundy', 'wine red', 'maroon'],
    'crimson': ['crimson', 'cherry red', 'bright red'],
    'brick red': ['brick red', 'rust red'],
    
    // Greens
    'forest green': ['forest green', 'dark green'],
    'olive green': ['olive', 'olive green', 'military green'],
    'emerald green': ['emerald', 'emerald green'],
    'sage green': ['sage', 'sage green', 'mint green'],
    
    // Browns
    'chocolate brown': ['chocolate', 'chocolate brown', 'dark brown'],
    'tan': ['tan', 'beige', 'sand', 'khaki'],
    'camel': ['camel', 'cognac', 'cognac brown'],
    
    // Grays
    'light gray': ['light gray', 'light grey', 'heather gray'],
    'stone gray': ['stone gray', 'stone grey', 'slate gray'],
    
    // Pinks
    'blush pink': ['blush', 'blush pink', 'dusty pink'],
    'hot pink': ['hot pink', 'bright pink', 'fuchsia'],
    'rose pink': ['rose', 'rose pink', 'dusty rose'],
    
    // Purples
    'deep purple': ['purple', 'deep purple', 'plum'],
    'lavender': ['lavender', 'light purple', 'violet'],
    
    // Yellows
    'mustard yellow': ['mustard', 'mustard yellow'],
    'golden yellow': ['golden', 'golden yellow', 'gold'],
    'pale yellow': ['pale yellow', 'cream yellow'],
    
    // Oranges
    'burnt orange': ['burnt orange', 'rust orange'],
    'coral': ['coral', 'peach', 'salmon'],
  };

  // Find the best color match
  let bestMatch = '';
  let bestConfidence = 0;
  let cleanItemName = itemName;

  for (const [standardColor, variations] of Object.entries(colorPatterns)) {
    for (const variation of variations) {
      if (name.includes(variation)) {
        const confidence = variation.length / name.length; // Longer matches = higher confidence
        if (confidence > bestConfidence) {
          bestMatch = standardColor;
          bestConfidence = confidence;
          // Remove the color part from the item name
          cleanItemName = itemName.replace(new RegExp(variation, 'gi'), '').trim();
        }
      }
    }
  }

  // If no specific color found, try to extract basic colors
  if (!bestMatch) {
    const basicColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey'];
    for (const color of basicColors) {
      if (name.includes(color)) {
        bestMatch = color;
        bestConfidence = 0.5; // Lower confidence for basic colors
        cleanItemName = itemName.replace(new RegExp(color, 'gi'), '').trim();
        break;
      }
    }
  }

  return {
    primaryColor: bestMatch || 'unknown',
    colorConfidence: bestConfidence,
    itemName: cleanItemName || itemName
  };
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

export const extractClothingFromImage = async (
  imageFile: File,
  wardrobeItemId: string,
  feedback?: string,
  suggestions: string[] = []
): Promise<ExtractionResult> => {
  try {
    console.log('🔍 Starting enhanced AI-powered clothing extraction with color analysis for wardrobe item:', wardrobeItemId);

    // Get the original image URL from the wardrobe item
    const { data: wardrobeItem } = await supabase
      .from('wardrobe_items')
      .select('original_image_url, image_url')
      .eq('id', wardrobeItemId)
      .single();

    const originalImageUrl = wardrobeItem?.original_image_url || wardrobeItem?.image_url;
    console.log('📸 Using original image URL for extracted items:', originalImageUrl);

    // Step 1: Try Enhanced OpenAI Vision Analysis with Color Detection (Primary Method)
    console.log('🎯 Step 1: Attempting Enhanced OpenAI Vision Analysis with Color Detection...');
    try {
      const imageBase64 = await fileToBase64(imageFile);
      const visionResult = await extractFashionTagsWithVision(imageBase64, wardrobeItemId);
      
      if (visionResult.success && visionResult.tags && visionResult.tags.length > 0) {
        console.log('✅ Enhanced OpenAI Vision Analysis successful:', visionResult.tags.length, 'color-aware tags found');
        
        // Format vision tags as clothing items with enhanced color extraction
        const enhancedClothingItems = visionResult.tags.map(tag => {
          const colorExtraction = extractColorFromItemName(tag);
          
          return {
            name: colorExtraction.itemName,
            primaryColor: colorExtraction.primaryColor,
            colorConfidence: colorExtraction.colorConfidence,
            fullDescription: tag, // Keep original for reference
            descriptors: [colorExtraction.primaryColor].filter(Boolean),
            category: categorizeTag(colorExtraction.itemName),
            confidence: 0.92,
            source: 'openai-vision-enhanced',
            originalImageUrl: originalImageUrl,
            colorExtracted: true,
            extractionTimestamp: new Date().toISOString()
          };
        });

        await updateWardrobeItemWithClothing(wardrobeItemId, enhancedClothingItems);
        
        return {
          success: true,
          clothingItems: enhancedClothingItems,
          method: 'openai-vision-color-enhanced'
        };
      }
    } catch (visionError) {
      console.warn('⚠️ Enhanced OpenAI Vision Analysis failed:', visionError);
    }

    // Step 2: Try Google Vision API with Color Enhancement (Secondary Method)
    console.log('🎯 Step 2: Attempting Google Vision Analysis with Color Enhancement...');
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
        console.log('✅ Google Vision Analysis with color enhancement successful:', googleVisionResult.items.length, 'items found');
        
        // Enhance Google Vision results with color extraction
        const colorEnhancedItems = googleVisionResult.items.map(item => {
          const colorExtraction = extractColorFromItemName(item.name);
          
          return {
            ...item,
            name: colorExtraction.itemName,
            primaryColor: colorExtraction.primaryColor,
            colorConfidence: colorExtraction.colorConfidence,
            originalImageUrl: originalImageUrl,
            colorExtracted: true,
            descriptors: [...(item.descriptors || []), colorExtraction.primaryColor].filter(Boolean)
          };
        });

        await updateWardrobeItemWithClothing(wardrobeItemId, colorEnhancedItems);
        
        return {
          success: true,
          clothingItems: colorEnhancedItems,
          method: googleVisionResult.method + '-color-enhanced'
        };
      }
    } catch (googleError) {
      console.warn('⚠️ Google Vision Analysis failed:', googleError);
    }

    // Step 3: Try Hybrid Text-Based Extraction with Color Enhancement (Tertiary Method)
    if (feedback) {
      console.log('🎯 Step 3: Attempting Hybrid Text-Based Extraction with Color Enhancement...');
      try {
        const hybridResult = await extractClothingPhrasesHybrid(feedback, suggestions, wardrobeItemId);
        
        if (hybridResult.success && hybridResult.result && hybridResult.result.items.length > 0) {
          console.log('✅ Hybrid Text-Based Extraction with color enhancement successful:', hybridResult.result.items.length, 'items found');
          
          // Enhance hybrid results with color extraction
          const colorEnhancedItems = hybridResult.result.items.map(item => {
            const colorExtraction = extractColorFromItemName(item.name);
            
            return {
              ...item,
              name: colorExtraction.itemName,
              primaryColor: colorExtraction.primaryColor,
              colorConfidence: colorExtraction.colorConfidence,
              originalImageUrl: originalImageUrl,
              colorExtracted: true,
              descriptors: [...(item.descriptors || []), colorExtraction.primaryColor].filter(Boolean)
            };
          });

          await updateWardrobeItemWithClothing(wardrobeItemId, colorEnhancedItems);
          
          return {
            success: true,
            clothingItems: colorEnhancedItems,
            method: hybridResult.result.method + '-color-enhanced'
          };
        }
      } catch (hybridError) {
        console.warn('⚠️ Hybrid Text-Based Extraction failed:', hybridError);
      }
    }

    // Step 4: Final AI Extraction Fallback with Color Enhancement
    if (feedback) {
      console.log('🎯 Step 4: Attempting Final AI Extraction Fallback with Color Enhancement...');
      try {
        const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
        
        if (aiResult.success && aiResult.extractedItems && aiResult.extractedItems.length > 0) {
          console.log('✅ Final AI Extraction with color enhancement successful:', aiResult.extractedItems.length, 'items found');
          
          // Enhance AI results with color extraction
          const colorEnhancedItems = aiResult.extractedItems.map(item => {
            const colorExtraction = extractColorFromItemName(item.name);
            
            return {
              ...item,
              name: colorExtraction.itemName,
              primaryColor: colorExtraction.primaryColor,
              colorConfidence: colorExtraction.colorConfidence,
              originalImageUrl: originalImageUrl,
              colorExtracted: true,
              descriptors: [...(item.descriptors || []), colorExtraction.primaryColor].filter(Boolean)
            };
          });

          await updateWardrobeItemWithClothing(wardrobeItemId, colorEnhancedItems);
          
          return {
            success: true,
            clothingItems: colorEnhancedItems,
            method: 'ai-fallback-color-enhanced'
          };
        }
      } catch (aiError) {
        console.warn('⚠️ Final AI Extraction failed:', aiError);
      }
    }

    // All methods failed
    console.error('❌ All enhanced color extraction methods failed');
    return {
      success: false,
      error: 'All clothing extraction methods failed',
      method: 'none'
    };

  } catch (error) {
    console.error('❌ Critical error in enhanced clothing extraction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown extraction error',
      method: 'error'
    };
  }
};
