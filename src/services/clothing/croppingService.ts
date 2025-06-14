
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

const validateBoundingBox = (bbox: [number, number, number, number], canvasWidth: number, canvasHeight: number): boolean => {
  const [x, y, width, height] = bbox;
  
  // Check if coordinates are valid numbers
  if (!bbox.every(coord => typeof coord === 'number' && !isNaN(coord))) {
    return false;
  }
  
  // Check if bounding box is within canvas bounds
  if (x < 0 || y < 0 || x + width > canvasWidth || y + height > canvasHeight) {
    console.warn(`⚠️ Bounding box [${bbox.join(', ')}] is outside canvas bounds (${canvasWidth}x${canvasHeight})`);
    return false;
  }
  
  // Check minimum size (at least 20x20 pixels)
  if (width < 20 || height < 20) {
    console.warn(`⚠️ Bounding box too small: ${width}x${height}`);
    return false;
  }
  
  return true;
};

const adjustBoundingBox = (bbox: [number, number, number, number], canvasWidth: number, canvasHeight: number): BoundingBox => {
  let [x, y, width, height] = bbox;
  
  // Clamp to canvas bounds
  x = Math.max(0, Math.min(x, canvasWidth - 1));
  y = Math.max(0, Math.min(y, canvasHeight - 1));
  width = Math.min(width, canvasWidth - x);
  height = Math.min(height, canvasHeight - y);
  
  // Ensure minimum size
  width = Math.max(20, width);
  height = Math.max(20, height);
  
  return { x, y, width, height };
};

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
      detectionResult.detections.map(d => `${d.class} (${d.confidence.toFixed(2)})`));

    // Create canvas from image file
    const canvas = await createCanvasFromFile(imageFile);
    console.log(`📐 Canvas dimensions: ${canvas.width}x${canvas.height}`);
    
    const croppedImages: CroppedImageData[] = [];

    // Process each detection
    for (let i = 0; i < detectionResult.detections.length; i++) {
      const detection = detectionResult.detections[i];
      
      try {
        console.log(`🎯 Processing ${detection.class} (${i + 1}/${detectionResult.detections.length})`);
        
        // Validate bounding box
        if (!validateBoundingBox(detection.bbox, canvas.width, canvas.height)) {
          console.warn(`⚠️ Skipping ${detection.class} due to invalid bounding box`);
          continue;
        }
        
        // Adjust bounding box to canvas bounds
        const boundingBox = adjustBoundingBox(detection.bbox, canvas.width, canvas.height);

        console.log(`🎯 Cropping ${detection.class} with adjusted bbox:`, boundingBox);

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

        console.log(`✅ Successfully processed ${detection.class}: ${croppedImageUrl}`);

      } catch (error) {
        console.error(`❌ Failed to process ${detection.class}:`, error);
        // Continue with other items even if one fails
      }
    }

    console.log(`🎯 Cropping complete: ${croppedImages.length}/${detectionResult.detections.length} items processed successfully`);
    
    return croppedImages;

  } catch (error) {
    console.error('❌ Image cropping process failed:', error);
    return []; // Return empty array to not break the main flow
  }
};
