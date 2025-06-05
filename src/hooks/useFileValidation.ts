
export const useFileValidation = () => {
  const validateFile = (file: File): string | null => {
    console.log('Validating file:', { name: file.name, type: file.type, size: file.size });
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json') && !fileName.endsWith('.txt') && !fileName.endsWith('.csv')) {
      return 'File must have a .json, .txt, or .csv extension';
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

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = parseCSVLine(line);
      const row: any = {};

      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Handle array fields (comma-separated values within quotes or pipes)
        if (header.includes('descriptors') || header.includes('materials') || 
            header.includes('tags') || header.includes('association') || 
            header.includes('compatibility') || header.includes('types') || 
            header.includes('contexts') || header.includes('references')) {
          row[header] = parseArrayValue(value);
        } else {
          row[header] = value;
        }
      });

      data.push(row);
    }

    return data;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(val => val.replace(/"/g, ''));
  };

  const parseArrayValue = (value: string): string[] => {
    if (!value) return [];
    
    // Handle pipe-separated values
    if (value.includes('|')) {
      return value.split('|').map(item => item.trim()).filter(item => item.length > 0);
    }
    
    // Handle semicolon-separated values
    if (value.includes(';')) {
      return value.split(';').map(item => item.trim()).filter(item => item.length > 0);
    }
    
    // Handle comma-separated values (if not already parsed)
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  };

  const parseJSON = async (file: File): Promise<any[]> => {
    const text = await file.text();
    console.log('File content preview:', text.substring(0, 200) + '...');
    
    try {
      // Check if it's a CSV file
      if (file.name.toLowerCase().endsWith('.csv')) {
        return parseCSV(text);
      }
      
      // Handle JSON files
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
      if (file.name.toLowerCase().endsWith('.csv')) {
        throw new Error(`Invalid CSV format: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } else {
        throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  return { validateFile, parseJSON };
};
