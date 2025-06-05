import { supabase } from '@/integrations/supabase/client';

export interface PrimaryTaxonomyItem {
  id?: string;
  item_name: string;
  category: string;
  subcategory?: string;
  style_descriptors?: string[];
  common_materials?: string[];
  seasonal_tags?: string[];
  gender_association?: string[];
  formality_level?: string;
  fit_type?: string;
  color_compatibility?: string[];
  pattern_types?: string[];
  occasion_contexts?: string[];
  styling_notes?: string;
  academic_references?: string[];
  confidence_score?: number;
  priority_rank?: number;
  is_active?: boolean;
  source_file?: string;
}

export const uploadPrimaryTaxonomy = async (
  csvData: any[], 
  sourceFile: string
): Promise<{ success: boolean; count?: number; error?: string }> => {
  try {
    console.log(`Processing ${csvData.length} items from ${sourceFile}`);

    // Transform CSV data to match our schema
    const taxonomyItems: PrimaryTaxonomyItem[] = csvData.map(row => ({
      item_name: row.item_name || row.Item || row.fashion_item || '',
      category: row.category || row.Category || '',
      subcategory: row.subcategory || row.Subcategory || null,
      style_descriptors: parseArrayField(row.style_descriptors || row.Style_Descriptors),
      common_materials: parseArrayField(row.common_materials || row.Common_Materials),
      seasonal_tags: parseArrayField(row.seasonal_tags || row.Seasonal_Tags),
      gender_association: parseArrayField(row.gender_association || row.Gender_Association),
      formality_level: row.formality_level || row.Formality_Level || null,
      fit_type: row.fit_type || row.Fit_Type || null,
      color_compatibility: parseArrayField(row.color_compatibility || row.Color_Compatibility),
      pattern_types: parseArrayField(row.pattern_types || row.Pattern_Types),
      occasion_contexts: parseArrayField(row.occasion_contexts || row.Occasion_Contexts),
      styling_notes: row.styling_notes || row.Styling_Notes || null,
      academic_references: parseArrayField(row.academic_references || row.Academic_References),
      confidence_score: parseFloat(row.confidence_score || row.Confidence_Score || '0.95'),
      priority_rank: parseInt(row.priority_rank || row.Priority_Rank || '1'),
      is_active: true,
      source_file: sourceFile
    }));

    // Filter out items with empty names
    const validItems = taxonomyItems.filter(item => item.item_name && item.item_name.trim().length > 0);

    if (validItems.length === 0) {
      return { success: false, error: 'No valid items found in CSV data' };
    }

    console.log(`Found ${validItems.length} valid items to process`);

    // Check for existing items to avoid duplicates
    const itemNames = validItems.map(item => item.item_name.toLowerCase());
    const { data: existingItems, error: checkError } = await supabase
      .from('primary_fashion_taxonomy')
      .select('item_name')
      .in('item_name', itemNames.map(name => name.charAt(0).toUpperCase() + name.slice(1)));

    if (checkError) {
      console.error('Error checking existing items:', checkError);
      return { success: false, error: `Database check failed: ${checkError.message}` };
    }

    const existingNames = new Set((existingItems || []).map(item => item.item_name.toLowerCase()));
    const newItems = validItems.filter(item => !existingNames.has(item.item_name.toLowerCase()));

    console.log(`${existingNames.size} items already exist, ${newItems.length} new items to insert`);

    if (newItems.length === 0) {
      return { success: false, error: 'All items already exist in the database' };
    }

    // Insert new items in batches
    const batchSize = 50; // Smaller batch size for better error handling
    let totalInserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < newItems.length; i += batchSize) {
      const batch = newItems.slice(i, i + batchSize);
      
      try {
        const { error: insertError } = await supabase
          .from('primary_fashion_taxonomy')
          .insert(batch);

        if (insertError) {
          console.error(`Batch ${i / batchSize + 1} failed:`, insertError);
          errors.push(`Batch ${i / batchSize + 1}: ${insertError.message}`);
          continue;
        }

        totalInserted += batch.length;
        console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} items`);
      } catch (batchError) {
        console.error(`Batch ${i / batchSize + 1} exception:`, batchError);
        errors.push(`Batch ${i / batchSize + 1}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`);
      }
    }

    if (totalInserted === 0) {
      return { 
        success: false, 
        error: `Failed to insert any items. Errors: ${errors.join(', ')}` 
      };
    }

    const message = totalInserted === newItems.length 
      ? `Successfully uploaded ${totalInserted} new taxonomy items`
      : `Uploaded ${totalInserted} items with ${errors.length} errors`;

    console.log(message);
    return { success: true, count: totalInserted };

  } catch (error) {
    console.error('Error uploading primary taxonomy:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during upload' 
    };
  }
};

export const getPrimaryTaxonomy = async (limit: number = 1000) => {
  const { data, error } = await supabase
    .from('primary_fashion_taxonomy')
    .select('*')
    .eq('is_active', true)
    .order('priority_rank', { ascending: true })
    .order('item_name', { ascending: true })
    .limit(limit);

  return { data, error };
};

export const clearPrimaryTaxonomy = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('primary_fashion_taxonomy')
      .delete()
      .neq('id', ''); // Delete all records

    if (error) throw error;

    console.log('Primary taxonomy cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('Error clearing primary taxonomy:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

const parseArrayField = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    // Handle pipe-separated values first (preferred format)
    if (value.includes('|')) {
      return value.split('|').map(item => item.trim()).filter(item => item.length > 0);
    }
    // Handle semicolon-separated values
    if (value.includes(';')) {
      return value.split(';').map(item => item.trim()).filter(item => item.length > 0);
    }
    // Handle comma-separated values
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }
  return [];
};
