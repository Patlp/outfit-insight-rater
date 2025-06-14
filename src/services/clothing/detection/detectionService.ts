
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

    if (!data.success) {
      console.error('❌ Detection service returned error:', data.error);
      throw new Error(data.error || 'Detection service failed');
    }

    const detections = data.detections || [];
    console.log(`✅ Detected ${detections.length} clothing items`);
    
    // Log detection details for debugging
    detections.forEach((detection, index) => {
      console.log(`📍 Item ${index + 1}: ${detection.class} (confidence: ${detection.confidence.toFixed(2)}, bbox: [${detection.bbox.join(', ')}])`);
    });

    return { detections };

  } catch (error) {
    console.error('❌ Detection service error:', error);
    
    // Return empty result instead of throwing to allow graceful fallback
    console.log('🔄 Returning empty detection result for graceful fallback');
    return { detections: [] };
  }
};
