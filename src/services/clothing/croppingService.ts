
import { detectClothingItems } from './detection/detectionService';
import { cropImageFromCanvas, createCanvasFromFile, BoundingBox } from './canvas/canvasUtils';
import { uploadCroppedImage } from './upload/uploadService';
import { fileToBase64 } from './utils/imageUtils';

// Re-export types for backward compatibility
export type { BoundingBox } from './canvas/canvasUtils';

export interface CroppedImageData {
  item_name: string;
  cropped_image_url: string;
  bounding_box: BoundingBox;
  confidence: number;
}

export interface ObjectDetectionResult {
  detections: Array<{
    class: string;
    confidence: number;
    bbox: [number, number, number, number]; // [x, y, width, height]
  }>;
}

// Re-export functions for backward compatibility
export { detectClothingItems } from './detection/detectionService';
export { cropImageFromCanvas, createCanvasFromFile } from './canvas/canvasUtils';
export { uploadCroppedImage } from './upload/uploadService';

export const processImageCropping = async (
  imageFile: File,
  wardrobeItemId: string
): Promise<CroppedImageData[]> => {
  try {
    console.log('🎯 Starting image cropping process...');

    // Convert file to base64
    const base64 = await fileToBase64(imageFile);
    
    // Detect clothing items
    const detectionResult = await detectClothingItems(base64);
    
    if (!detectionResult.detections || detectionResult.detections.length === 0) {
      console.log('📷 No clothing items detected for cropping');
      return [];
    }

    console.log(`🔍 Found ${detectionResult.detections.length} items to crop:`, 
      detectionResult.detections.map(d => d.class));

    // Create canvas from image file
    const canvas = await createCanvasFromFile(imageFile);
    
    const croppedImages: CroppedImageData[] = [];

    // Process each detection
    for (const detection of detectionResult.detections) {
      try {
        const boundingBox: BoundingBox = {
          x: detection.bbox[0],
          y: detection.bbox[1],
          width: detection.bbox[2],
          height: detection.bbox[3]
        };

        console.log(`🎯 Cropping ${detection.class} with bbox:`, boundingBox);

        // Crop the image
        const croppedBlob = await cropImageFromCanvas(canvas, boundingBox);
        
        console.log(`📷 Created blob for ${detection.class}, size: ${croppedBlob.size} bytes`);
        
        // Upload the cropped image
        const croppedImageUrl = await uploadCroppedImage(
          croppedBlob,
          wardrobeItemId,
          detection.class
        );

        const croppedImageData: CroppedImageData = {
          item_name: detection.class,
          cropped_image_url: croppedImageUrl,
          bounding_box: boundingBox,
          confidence: detection.confidence
        };

        croppedImages.push(croppedImageData);

        console.log(`✅ Successfully processed ${detection.class}:`, croppedImageData);

      } catch (error) {
        console.error(`❌ Failed to process ${detection.class}:`, error);
        // Continue with other items even if one fails
      }
    }

    console.log(`🎯 Cropping complete: ${croppedImages.length}/${detectionResult.detections.length} items processed successfully`);
    
    // Log the final result for debugging
    console.log('📋 Final cropped images data:', croppedImages);
    
    return croppedImages;

  } catch (error) {
    console.error('❌ Image cropping process failed:', error);
    return []; // Return empty array to not break the main flow
  }
};
