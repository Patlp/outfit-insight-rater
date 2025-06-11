
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

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

export const createCanvasFromFile = (file: File): Promise<HTMLCanvasElement> => {
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
