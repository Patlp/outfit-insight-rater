
import { supabase } from '@/integrations/supabase/client';
import { getFashionWhitelist } from './fashionWhitelistService';
import { extractClothingPhrasesAI } from './clothing/aiExtraction';
import { AIClothingItem } from './clothing/types';
import { validateTagStructure, enforceTagGrammar, formatTagName } from './tagging/grammarValidation';

const GOOGLE_VISION_API_KEY = 'AIzaSyB5ck3I-Vc95beRtY9wgB3XL7237IeOAF8';
const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

interface GoogleVisionLabel {
  description: string;
  score: number;
  topicality: number;
}

interface GoogleVisionResponse {
  responses: Array<{
    labelAnnotations?: GoogleVisionLabel[];
    error?: {
      code: number;
      message: string;
    };
  }>;
}

// Enhanced clothing-related keywords with better categorization
const CLOTHING_KEYWORDS = [
  'shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'hoodie', 't-shirt', 'polo', 'vest', 'coat',
  'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'dress', 'gown',
  'shoes', 'sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers',
  'belt', 'bag', 'purse', 'backpack', 'hat', 'cap', 'scarf', 'gloves',
  'denim', 'leather', 'cotton', 'wool', 'silk', 'linen', 'suede', 'velvet',
  'footwear', 'outerwear', 'underwear', 'swimwear', 'activewear', 'formal wear'
];

const COLOR_DESCRIPTORS = [
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey', 
  'brown', 'navy', 'beige', 'cream', 'tan', 'olive', 'maroon', 'teal', 'coral', 'burgundy', 'khaki',
  'light', 'dark', 'bright', 'pale', 'deep'
];

const STYLE_DESCRIPTORS = [
  'casual', 'formal', 'vintage', 'modern', 'classic', 'trendy', 'athletic', 'elegant',
  'fitted', 'loose', 'oversized', 'slim', 'cropped', 'striped', 'plaid', 'checkered', 
  'floral', 'graphic', 'plain', 'solid', 'ripped', 'distressed', 'high-waisted'
];

export const analyzeImageWithGoogleVision = async (imageUrl: string): Promise<{ success: boolean; labels?: GoogleVisionLabel[]; error?: string }> => {
  try {
    console.log('=== GOOGLE VISION ANALYSIS WITH GRAMMAR RULES ===');
    console.log('Analyzing image with enhanced structure validation:', imageUrl);
    
    const requestBody = {
      requests: [
        {
          image: {
            source: {
              imageUri: imageUrl
            }
          },
          features: [
            {
              type: "LABEL_DETECTION",
              maxResults: 25
            }
          ]
        }
      ]
    };

    const response = await fetch(VISION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Vision API request failed: ${response.status} ${response.statusText}`);
    }

    const data: GoogleVisionResponse = await response.json();
    
    if (data.responses[0]?.error) {
      throw new Error(`Vision API error: ${data.responses[0].error.message}`);
    }

    const labels = data.responses[0]?.labelAnnotations || [];
    console.log(`Google Vision returned ${labels.length} labels for grammar processing`);

    return { success: true, labels };
  } catch (error) {
    console.error('Google Vision API error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown Vision API error' 
    };
  }
};

const filterClothingLabels = (labels: GoogleVisionLabel[]): GoogleVisionLabel[] => {
  console.log('Filtering labels with grammar rules...');
  return labels.filter(label => {
    const description = label.description.toLowerCase();
    return CLOTHING_KEYWORDS.some(keyword => 
      description.includes(keyword) || keyword.includes(description)
    );
  }).sort((a, b) => b.score - a.score);
};

const formatClothingTagsWithGrammar = async (clothingLabels: GoogleVisionLabel[]): Promise<AIClothingItem[]> => {
  console.log('=== APPLYING STRICT GRAMMAR RULES TO TAGS ===');
  console.log('Processing labels with 2-word max and grammar validation...');
  
  const { data: whitelistData } = await getFashionWhitelist();
  const whitelist = whitelistData || [];
  
  const formattedTags: AIClothingItem[] = [];
  const usedItems = new Set<string>();

  for (const label of clothingLabels) {
    if (formattedTags.length >= 6) break;
    
    const description = label.description.toLowerCase();
    
    // Find matching whitelist item
    const whitelistMatch = whitelist.find(item => 
      description.includes(item.item_name.toLowerCase()) ||
      item.item_name.toLowerCase().includes(description)
    );
    
    if (whitelistMatch) {
      const itemKey = whitelistMatch.item_name.toLowerCase();
      if (!usedItems.has(itemKey)) {
        
        // Extract primary descriptor with strict rules
        let primaryDescriptor: string | null = null;
        
        // Look for color descriptors first
        const colorMatch = clothingLabels.find(l => 
          COLOR_DESCRIPTORS.some(color => l.description.toLowerCase().includes(color))
        );
        if (colorMatch && !primaryDescriptor) {
          const color = COLOR_DESCRIPTORS.find(c => colorMatch.description.toLowerCase().includes(c));
          if (color) primaryDescriptor = color;
        }
        
        // Look for style descriptors if no color found
        if (!primaryDescriptor) {
          const styleMatch = clothingLabels.find(l => 
            STYLE_DESCRIPTORS.some(style => l.description.toLowerCase().includes(style))
          );
          if (styleMatch) {
            const style = STYLE_DESCRIPTORS.find(s => styleMatch.description.toLowerCase().includes(s));
            if (style) primaryDescriptor = style;
          }
        }
        
        // Apply strict grammar formatting
        const formattedName = formatTagName(primaryDescriptor, whitelistMatch.item_name);
        
        // Validate the final tag structure
        const validation = validateTagStructure(formattedName);
        
        if (validation.isValid) {
          console.log(`✅ Grammar-valid tag: "${formattedName}"`);
          
          formattedTags.push({
            name: formattedName,
            descriptors: primaryDescriptor ? [primaryDescriptor] : [],
            category: whitelistMatch.category,
            confidence: label.score * 0.95, // Slight boost for grammar compliance
            source: 'google-vision-grammar'
          });
          
          usedItems.add(itemKey);
        } else {
          console.log(`❌ Grammar validation failed for "${formattedName}": ${validation.errors.join(', ')}`);
          
          // Try using corrected version if available
          if (validation.correctedTag) {
            const correctedValidation = validateTagStructure(validation.correctedTag);
            if (correctedValidation.isValid) {
              console.log(`✅ Using corrected tag: "${validation.correctedTag}"`);
              
              formattedTags.push({
                name: validation.correctedTag,
                descriptors: primaryDescriptor ? [primaryDescriptor] : [],
                category: whitelistMatch.category,
                confidence: label.score * 0.85, // Lower confidence for corrected tags
                source: 'google-vision-corrected'
              });
              
              usedItems.add(itemKey);
            }
          }
        }
      }
    }
  }
  
  // Final grammar enforcement
  const grammarValidatedTags = formattedTags.filter(tag => {
    const validation = validateTagStructure(tag.name);
    if (!validation.isValid) {
      console.log(`🚫 Final filter rejected: "${tag.name}" - ${validation.errors.join(', ')}`);
      return false;
    }
    return true;
  });
  
  console.log(`=== GRAMMAR VALIDATION COMPLETE ===`);
  console.log(`Original labels: ${clothingLabels.length}`);
  console.log(`Formatted tags: ${formattedTags.length}`);
  console.log(`Grammar-validated tags: ${grammarValidatedTags.length}`);
  
  return grammarValidatedTags;
};

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
