
import { supabase } from '@/integrations/supabase/client';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

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

export const cropImageFromCanvas = (
  canvas: HTMLCanvasElement,
  bbox: BoundingBox,
  targetSize: number = 300
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new canvas for the cropped image
      const croppedCanvas = document.createElement('canvas');
      const ctx = croppedCanvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate crop dimensions with padding
      const padding = 10;
      const cropX = Math.max(0, bbox.x - padding);
      const cropY = Math.max(0, bbox.y - padding);
      const cropWidth = Math.min(canvas.width - cropX, bbox.width + (padding * 2));
      const cropHeight = Math.min(canvas.height - cropY, bbox.height + (padding * 2));

      // Set canvas size to target size while maintaining aspect ratio
      const aspectRatio = cropWidth / cropHeight;
      let finalWidth = targetSize;
      let finalHeight = targetSize;

      if (aspectRatio > 1) {
        finalHeight = targetSize / aspectRatio;
      } else {
        finalWidth = targetSize * aspectRatio;
      }

      croppedCanvas.width = finalWidth;
      croppedCanvas.height = finalHeight;

      // Draw the cropped and resized image
      ctx.drawImage(
        canvas,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, finalWidth, finalHeight
      );

      // Convert to blob
      croppedCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/jpeg', 0.85);

    } catch (error) {
      reject(error);
    }
  });
};

export const uploadCroppedImage = async (
  blob: Blob,
  wardrobeItemId: string,
  itemName: string
): Promise<string> => {
  try {
    // Create a simple filename
    const fileName = `${wardrobeItemId}_${itemName.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    const filePath = `cropped-items/${fileName}`;

    console.log(`📤 Uploading cropped image: ${filePath}`);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('wardrobe-items')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('wardrobe-items')
      .getPublicUrl(filePath);

    console.log(`✅ Upload successful: ${publicUrl}`);
    
    // Verify the URL is accessible
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ Image URL verified accessible: ${publicUrl}`);
      } else {
        console.warn(`⚠️ Image URL may not be accessible: ${response.status} ${response.statusText}`);
      }
    } catch (fetchError) {
      console.warn(`⚠️ Could not verify image URL accessibility:`, fetchError);
    }
    
    return publicUrl;

  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
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

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

const createCanvasFromFile = (file: File): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      console.log(`📐 Canvas created: ${canvas.width}x${canvas.height}`);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};
