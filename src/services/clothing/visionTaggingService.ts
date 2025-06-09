
import { supabase } from '@/integrations/supabase/client';

export interface VisionTaggingResult {
  success: boolean;
  tags: string[];
  error?: string;
}

export const extractFashionTagsWithVision = async (
  imageBase64: string,
  wardrobeItemId: string
): Promise<VisionTaggingResult> => {
  try {
    console.log('🔍 Starting OpenAI vision tagging for wardrobe item:', wardrobeItemId);

    const { data, error } = await supabase.functions.invoke('vision-fashion-tagging', {
      body: {
        imageBase64,
        wardrobeItemId
      }
    });

    if (error) {
      console.error('Vision tagging function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to extract fashion tags'
      };
    }

    if (!data.success) {
      console.error('Vision tagging failed:', data.error);
      return {
        success: false,
        error: data.error || 'Unknown vision tagging error'
      };
    }

    console.log(`✅ Successfully extracted ${data.tags.length} fashion tags:`, data.tags);

    return {
      success: true,
      tags: data.tags
    };

  } catch (error) {
    console.error('Vision tagging service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown service error'
    };
  }
};

// Helper function to convert File to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
