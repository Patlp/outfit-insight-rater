
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
  preservedName: string; // Keep original name with color
  extractedColor: string;
  colorConfidence: number;
  cleanItemName: string; // Clean name without color for categorization
  fullDescription: string;
}

// Enhanced color extraction that PRESERVES original context
const extractAndPreserveColorContext = (itemName: string): ColorExtractionResult => {
  const originalName = itemName.trim();
  const lowerName = originalName.toLowerCase();
  
  // Define comprehensive color mapping with fashion-specific terms
  const colorPatterns = {
    // Blacks
    'black': ['black', 'jet black', 'midnight black', 'charcoal black'],
    'charcoal': ['charcoal', 'dark gray', 'anthracite', 'charcoal gray'],
    
    // Whites  
    'white': ['white', 'pure white', 'snow white'],
    'cream': ['cream', 'ivory', 'off-white', 'pearl white', 'eggshell', 'bone white'],
    
    // Blues
    'navy blue': ['navy', 'navy blue', 'dark navy', 'midnight blue'],
    'royal blue': ['royal blue', 'cobalt blue', 'electric blue'],
    'sky blue': ['sky blue', 'light blue', 'powder blue', 'baby blue'],
    'denim blue': ['denim', 'denim blue', 'jean blue', 'indigo'],
    'teal': ['teal', 'teal blue', 'turquoise'],
    
    // Reds
    'burgundy': ['burgundy', 'wine red', 'maroon', 'deep red'],
    'crimson': ['crimson', 'cherry red', 'bright red', 'fire red'],
    'brick red': ['brick red', 'rust red', 'terracotta'],
    
    // Greens
    'forest green': ['forest green', 'dark green', 'hunter green'],
    'olive green': ['olive', 'olive green', 'military green', 'khaki green'],
    'emerald green': ['emerald', 'emerald green', 'jade green'],
    'sage green': ['sage', 'sage green', 'mint green', 'seafoam'],
    
    // Browns
    'chocolate brown': ['chocolate', 'chocolate brown', 'dark brown', 'espresso'],
    'tan': ['tan', 'beige', 'sand', 'camel brown'],
    'camel': ['camel', 'cognac', 'cognac brown', 'honey brown'],
    
    // Grays
    'light gray': ['light gray', 'light grey', 'heather gray', 'silver gray'],
    'stone gray': ['stone gray', 'stone grey', 'slate gray', 'pewter'],
    
    // Pinks
    'blush pink': ['blush', 'blush pink', 'dusty pink', 'rose pink'],
    'hot pink': ['hot pink', 'bright pink', 'fuchsia', 'magenta'],
    'rose pink': ['rose', 'rose pink', 'dusty rose', 'mauve'],
    
    // Purples
    'deep purple': ['purple', 'deep purple', 'plum', 'eggplant'],
    'lavender': ['lavender', 'light purple', 'violet', 'lilac'],
    
    // Yellows
    'mustard yellow': ['mustard', 'mustard yellow', 'ochre'],
    'golden yellow': ['golden', 'golden yellow', 'gold', 'amber'],
    'pale yellow': ['pale yellow', 'cream yellow', 'butter yellow'],
    
    // Oranges
    'burnt orange': ['burnt orange', 'rust orange', 'copper'],
    'coral': ['coral', 'peach', 'salmon', 'apricot'],
  };

  // Find the best color match while preserving context
  let bestMatch = '';
  let bestConfidence = 0;
  let matchedPhrase = '';

  for (const [standardColor, variations] of Object.entries(colorPatterns)) {
    for (const variation of variations) {
      if (lowerName.includes(variation)) {
        const confidence = variation.length / lowerName.length; // Longer matches = higher confidence
        if (confidence > bestConfidence) {
          bestMatch = standardColor;
          bestConfidence = confidence;
          matchedPhrase = variation;
        }
      }
    }
  }

  // If no specific color found, try basic colors
  if (!bestMatch) {
    const basicColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey'];
    for (const color of basicColors) {
      if (lowerName.includes(color)) {
        bestMatch = color;
        bestConfidence = 0.5;
        matchedPhrase = color;
        break;
      }
    }
  }

  // Create clean item name for categorization (remove color)
  const cleanItemName = matchedPhrase 
    ? originalName.replace(new RegExp(matchedPhrase, 'gi'), '').trim()
    : originalName;

  return {
    preservedName: originalName, // KEEP ORIGINAL WITH COLOR
    extractedColor: bestMatch || 'neutral',
    colorConfidence: bestConfidence,
    cleanItemName: cleanItemName || originalName,
    fullDescription: originalName
  };
};

// Generate context-aware prompts that preserve original analysis
const generateContextAwarePrompt = (
  colorResult: ColorExtractionResult,
  category: string,
  originalImageUrl?: string
): string => {
  const { preservedName, extractedColor, colorConfidence } = colorResult;
  
  // Build prompt that preserves the original context
  let prompt = `Professional product photography of a "${preservedName}"`;
  
  // Add color emphasis if confidence is high
  if (colorConfidence > 0.3 && extractedColor !== 'neutral') {
    prompt += `, emphasizing the ${extractedColor} color accuracy`;
  }
  
  // Add category-specific styling
  const categoryStyles: Record<string, string> = {
    'tops': 'with natural drape and fabric flow, floating presentation',
    'bottoms': 'with proper fit and structure, natural garment shape',
    'dresses': 'with elegant silhouette and natural drape, full-length view',
    'outerwear': 'with structured tailoring and professional finish',
    'footwear': 'with authentic material texture and finish, 3/4 angle view',
    'accessories': 'with premium material quality and craftsmanship, optimal angle'
  };
  
  const categoryStyle = categoryStyles[category.toLowerCase()] || 'with professional presentation';
  prompt += `, ${categoryStyle}`;
  
  // Add technical specifications for color accuracy
  prompt += ', floating with invisible support on pure white seamless background';
  prompt += ', professional studio lighting with accurate color representation';
  prompt += ', high resolution product photography maintaining exact color fidelity';
  prompt += ', clean isolated presentation with no shadows or reflections';
  
  // Add reference context if available
  if (originalImageUrl) {
    prompt += ', matching the style and color accuracy of the original garment';
  }
  
  // Add negative prompt for accuracy
  const negativePrompt = `no mannequin, no model, no person, no background elements, no additional clothing, no accessories, no shadows, no logos, no color distortion, maintain exact ${extractedColor} color tone as described`;
  
  return `${prompt}\n\nNEGATIVE PROMPT: ${negativePrompt}`;
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
    console.log('🔍 Starting context-aware clothing extraction with preserved color analysis for wardrobe item:', wardrobeItemId);

    // Get the original image URL from the wardrobe item
    const { data: wardrobeItem } = await supabase
      .from('wardrobe_items')
      .select('original_image_url, image_url')
      .eq('id', wardrobeItemId)
      .single();

    const originalImageUrl = wardrobeItem?.original_image_url || wardrobeItem?.image_url;
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
          const contextPrompt = generateContextAwarePrompt(colorResult, category, originalImageUrl);
          
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
          const contextPrompt = generateContextAwarePrompt(colorResult, category, originalImageUrl);
          
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
            const contextPrompt = generateContextAwarePrompt(colorResult, category, originalImageUrl);
            
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
            const contextPrompt = generateContextAwarePrompt(colorResult, category, originalImageUrl);
            
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
