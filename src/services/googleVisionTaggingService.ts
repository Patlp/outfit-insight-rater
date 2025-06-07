
import { supabase } from '@/integrations/supabase/client';
import { getFashionWhitelist } from './fashionWhitelistService';
import { extractClothingPhrasesAI } from './clothing/aiExtraction';
import { AIClothingItem } from './clothing/types';

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

// Clothing-related keywords for filtering Vision API labels
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
  'brown', 'navy', 'beige', 'cream', 'tan', 'olive', 'maroon', 'teal', 'coral', 'burgundy', 'khaki'
];

const STYLE_DESCRIPTORS = [
  'casual', 'formal', 'vintage', 'modern', 'classic', 'trendy', 'athletic', 'elegant',
  'fitted', 'loose', 'oversized', 'slim', 'cropped', 'long-sleeve', 'short-sleeve', 'sleeveless',
  'striped', 'plaid', 'checkered', 'floral', 'graphic', 'plain', 'solid'
];

export const analyzeImageWithGoogleVision = async (imageUrl: string): Promise<{ success: boolean; labels?: GoogleVisionLabel[]; error?: string }> => {
  try {
    console.log('Analyzing image with Google Vision API:', imageUrl);
    
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
    console.log(`Google Vision returned ${labels.length} labels:`, labels.map(l => l.description));

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
  return labels.filter(label => {
    const description = label.description.toLowerCase();
    return CLOTHING_KEYWORDS.some(keyword => 
      description.includes(keyword) || keyword.includes(description)
    );
  }).sort((a, b) => b.score - a.score); // Sort by confidence score
};

const formatClothingTags = async (clothingLabels: GoogleVisionLabel[]): Promise<AIClothingItem[]> => {
  console.log('Formatting clothing tags from labels:', clothingLabels.map(l => l.description));
  
  // Get fashion whitelist for validation
  const { data: whitelistData } = await getFashionWhitelist();
  const whitelist = whitelistData || [];
  
  const formattedTags: AIClothingItem[] = [];
  const usedItems = new Set<string>();

  for (const label of clothingLabels) {
    if (formattedTags.length >= 6) break; // Limit to 6 tags
    
    const description = label.description.toLowerCase();
    
    // Find matching whitelist item
    const whitelistMatch = whitelist.find(item => 
      description.includes(item.item_name.toLowerCase()) ||
      item.item_name.toLowerCase().includes(description)
    );
    
    if (whitelistMatch) {
      const itemKey = whitelistMatch.item_name.toLowerCase();
      if (!usedItems.has(itemKey)) {
        // Try to add descriptors from other labels
        const descriptors: string[] = [];
        
        // Look for color descriptors
        const colorMatch = clothingLabels.find(l => 
          COLOR_DESCRIPTORS.some(color => l.description.toLowerCase().includes(color))
        );
        if (colorMatch) {
          const color = COLOR_DESCRIPTORS.find(c => colorMatch.description.toLowerCase().includes(c));
          if (color) descriptors.push(color);
        }
        
        // Look for style descriptors
        const styleMatch = clothingLabels.find(l => 
          STYLE_DESCRIPTORS.some(style => l.description.toLowerCase().includes(style))
        );
        if (styleMatch) {
          const style = STYLE_DESCRIPTORS.find(s => styleMatch.description.toLowerCase().includes(s));
          if (style) descriptors.push(style);
        }
        
        // Format the final tag name
        let tagName = whitelistMatch.item_name;
        if (descriptors.length > 0) {
          tagName = `${descriptors.join(' ')} ${whitelistMatch.item_name}`;
        }
        
        // Ensure max 4 words
        const words = tagName.split(' ');
        if (words.length > 4) {
          tagName = words.slice(0, 4).join(' ');
        }
        
        formattedTags.push({
          name: tagName,
          descriptors: descriptors,
          category: whitelistMatch.category,
          confidence: label.score,
          source: 'google-vision'
        });
        
        usedItems.add(itemKey);
      }
    }
  }
  
  console.log('Formatted tags:', formattedTags.map(t => t.name));
  return formattedTags;
};

export const extractClothingTagsWithGoogleVision = async (
  imageUrl: string,
  wardrobeItemId: string,
  feedback?: string,
  suggestions: string[] = []
): Promise<{ success: boolean; items?: AIClothingItem[]; error?: string; method: string }> => {
  console.log('=== GOOGLE VISION CLOTHING TAGGING START ===');
  console.log(`Image URL: ${imageUrl}`);
  console.log(`Wardrobe item: ${wardrobeItemId}`);
  
  try {
    // Step 1: Analyze image with Google Vision API
    const visionResult = await analyzeImageWithGoogleVision(imageUrl);
    
    if (!visionResult.success || !visionResult.labels || visionResult.labels.length === 0) {
      console.log('Google Vision failed or returned no labels, falling back to OpenAI');
      
      // Fallback to OpenAI if Vision API fails
      if (feedback) {
        const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
        if (aiResult.success && aiResult.extractedItems) {
          console.log('OpenAI fallback successful');
          return { 
            success: true, 
            items: aiResult.extractedItems, 
            method: 'openai-fallback' 
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
    console.log(`Filtered to ${clothingLabels.length} clothing-related labels:`, clothingLabels.map(l => l.description));
    
    if (clothingLabels.length === 0) {
      console.log('No clothing labels found, falling back to OpenAI');
      
      // Fallback to OpenAI if no clothing detected
      if (feedback) {
        const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
        if (aiResult.success && aiResult.extractedItems) {
          return { 
            success: true, 
            items: aiResult.extractedItems, 
            method: 'openai-fallback' 
          };
        }
      }
      
      return { 
        success: false, 
        error: 'No clothing items detected in image',
        method: 'no-clothing-detected'
      };
    }
    
    // Step 3: Format tags using app structure
    const formattedTags = await formatClothingTags(clothingLabels);
    
    if (formattedTags.length === 0) {
      console.log('No valid tags generated, falling back to OpenAI');
      
      // Fallback if formatting failed
      if (feedback) {
        const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
        if (aiResult.success && aiResult.extractedItems) {
          return { 
            success: true, 
            items: aiResult.extractedItems, 
            method: 'openai-fallback' 
          };
        }
      }
      
      return { 
        success: false, 
        error: 'Failed to generate valid clothing tags',
        method: 'formatting-failed'
      };
    }
    
    // Step 4: Update wardrobe item with Google Vision results
    const { error: updateError } = await supabase
      .from('wardrobe_items')
      .update({ 
        extracted_clothing_items: formattedTags,
        updated_at: new Date().toISOString()
      })
      .eq('id', wardrobeItemId);

    if (updateError) {
      console.error('Error updating wardrobe item:', updateError);
      throw new Error('Failed to save Google Vision tags');
    }
    
    console.log('=== GOOGLE VISION TAGGING COMPLETE ===');
    console.log(`Successfully generated ${formattedTags.length} tags using Google Vision API`);
    
    return { 
      success: true, 
      items: formattedTags, 
      method: 'google-vision' 
    };
    
  } catch (error) {
    console.error('Error in Google Vision tagging:', error);
    
    // Final fallback to OpenAI on any error
    if (feedback) {
      console.log('Attempting final OpenAI fallback due to error');
      try {
        const aiResult = await extractClothingPhrasesAI(feedback, suggestions, wardrobeItemId);
        if (aiResult.success && aiResult.extractedItems) {
          return { 
            success: true, 
            items: aiResult.extractedItems, 
            method: 'openai-fallback-error' 
          };
        }
      } catch (fallbackError) {
        console.error('OpenAI fallback also failed:', fallbackError);
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown Google Vision error',
      method: 'error'
    };
  }
};
