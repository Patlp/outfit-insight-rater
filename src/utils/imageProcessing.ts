
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export const validateFile = (file: File): boolean => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    toast.error('Please upload a JPG or PNG image');
    return false;
  }
  
  // Check file size (50MB max as fallback)
  const maxSize = 50 * 1024 * 1024; // 50MB in bytes
  if (file.size > maxSize) {
    toast.error('Image size should be less than 50MB');
    return false;
  }
  
  return true;
};

export const compressImage = async (
  file: File,
  setIsCompressing: (compressing: boolean) => void
): Promise<File> => {
  try {
    setIsCompressing(true);
    
    // Only compress if file is larger than 2MB
    if (file.size <= 2 * 1024 * 1024) {
      console.log('File is already small enough, skipping compression');
      return file;
    }

    console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    const options = {
      maxSizeMB: 4.5, // Target size slightly under 5MB
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type,
      initialQuality: 0.8,
    };

    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    
    toast.success(`Image compressed from ${(file.size / 1024 / 1024).toFixed(1)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB`);
    return compressedFile;
  } catch (error) {
    console.error('Compression failed:', error);
    toast.warning('Image compression failed, using original file');
    return file; // Return original file if compression fails
  } finally {
    setIsCompressing(false);
  }
};
