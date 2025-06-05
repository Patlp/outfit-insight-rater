
export const useFileValidation = () => {
  const validateFile = (file: File): string | null => {
    console.log('Validating file:', { name: file.name, type: file.type, size: file.size });
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
      return 'File must have a .json or .txt extension';
    }
    
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }
    
    // Check if file is empty
    if (file.size === 0) {
      return 'File cannot be empty';
    }
    
    return null;
  };

  const parseJSON = async (file: File): Promise<any[]> => {
    const text = await file.text();
    console.log('File content preview:', text.substring(0, 200) + '...');
    
    try {
      const data = JSON.parse(text);
      
      if (Array.isArray(data)) {
        return data;
      } else if (data.categories && Array.isArray(data.categories)) {
        return data.categories;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else {
        throw new Error('JSON file should contain an array of categories or have a "categories"/"data" property with an array');
      }
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return { validateFile, parseJSON };
};
