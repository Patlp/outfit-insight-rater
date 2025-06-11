
import { supabase } from '@/integrations/supabase/client';

export interface ObjectDetectionResult {
  detections: Array<{
    class: string;
    confidence: number;
    bbox: [number, number, number, number]; // [x, y, width, height]
  }>;
}

export const detectClothingItems = async (imageBase64: string): Promise<ObjectDetectionResult> => {
  try {
    console.log('🔍 Starting clothing item detection...');

    const { data, error } = await supabase.functions.invoke('detect-clothing-objects', {
      body: { imageBase64 }
    });

    if (error) {
      console.error('❌ Object detection failed:', error);
      throw new Error(error.message);
    }

    console.log(`✅ Detected ${data.detections?.length || 0} clothing items`);
    return data;

  } catch (error) {
    console.error('❌ Detection service error:', error);
    throw error;
  }
};
