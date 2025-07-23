
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export const validateFile = (file: File): boolean => {
  try {
    console.log('Validating file:', { name: file.name, size: file.size, type: file.type });
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      toast.error('Please upload a JPG or PNG image');
      return false;
    }
    
    // Check file size (50MB max as fallback)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      console.error('File too large:', file.size);
      toast.error('Image size should be less than 50MB');
      return false;
    }
    
    console.log('File validation successful');
    return true;
  } catch (error) {
    console.error('File validation error:', error);
    toast.error('Error validating file');
    return false;
  }
};

export const compressImage = async (
  file: File,
  setIsCompressing: (compressing: boolean) => void
): Promise<File> => {
  let compressionStartTime: number;
  
  try {
    compressionStartTime = performance.now();
    setIsCompressing(true);
    
    console.log('Starting image compression:', {
      name: file.name,
      size: file.size,
      type: file.type,
      timestamp: new Date().toISOString()
    });
    
    // Only compress if file is larger than 2MB
    if (file.size <= 2 * 1024 * 1024) {
      console.log('File is already small enough, skipping compression');
      return file;
    }

    console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    // More conservative compression options for stability
    const options = {
      maxSizeMB: 3, // More conservative target size
      maxWidthOrHeight: 1600, // Reduced max dimensions
      useWebWorker: false, // Disable web worker for better compatibility
      fileType: file.type,
      initialQuality: 0.7,
      alwaysKeepResolution: false,
    };

    const compressedFile = await imageCompression(file, options);
    
    const compressionTime = performance.now() - compressionStartTime;
    console.log('Compression completed:', {
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: (compressedFile.size / file.size * 100).toFixed(1) + '%',
      duration: compressionTime.toFixed(2) + 'ms'
    });
    
    toast.success(`Image compressed from ${(file.size / 1024 / 1024).toFixed(1)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB`);
    return compressedFile;
  } catch (error) {
    const compressionTime = performance.now() - compressionStartTime!;
    console.error('Compression failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: compressionTime?.toFixed(2) + 'ms',
      fileSize: file.size,
      fileType: file.type
    });
    
    toast.warning('Image compression failed, using original file');
    return file; // Return original file if compression fails
  } finally {
    setIsCompressing(false);
    
    // Clean up memory
    if (typeof window !== 'undefined' && window.gc) {
      try {
        window.gc();
      } catch (e) {
        // Garbage collection not available
      }
    }
  }
};
