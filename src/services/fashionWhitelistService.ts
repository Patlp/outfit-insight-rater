
import { supabase } from '@/integrations/supabase/client';
import { getPrimaryTaxonomy } from './primaryTaxonomyService';

export interface FashionWhitelistItem {
  id: string;
  item_name: string;
  category: string;
  style_descriptors: string[];
  common_materials: string[];
  created_at: string;
}

export const syncWhitelistWithPrimaryTaxonomy = async (): Promise<{ success: boolean; count?: number; error?: string }> => {
  try {
    console.log('Syncing whitelist with primary taxonomy...');
    
    // Get all primary taxonomy data
    const { data: primaryTaxonomy, error: taxonomyError } = await getPrimaryTaxonomy(5000);
    
    if (taxonomyError || !primaryTaxonomy) {
      throw new Error('Failed to fetch primary taxonomy data');
    }

    // Clear existing whitelist
    const { error: clearError } = await supabase
      .from('fashion_whitelist')
      .delete()
      .neq('id', '');

    if (clearError) {
      throw new Error(`Failed to clear whitelist: ${clearError.message}`);
    }

    // Transform primary taxonomy to whitelist format
    const whitelistItems = primaryTaxonomy.map(item => ({
      item_name: item.item_name,
      category: item.category,
      style_descriptors: item.style_descriptors || [],
      common_materials: item.common_materials || []
    }));

    // Insert in batches
    const batchSize = 50;
    let totalInserted = 0;

    for (let i = 0; i < whitelistItems.length; i += batchSize) {
      const batch = whitelistItems.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('fashion_whitelist')
        .insert(batch);

      if (insertError) {
        console.error(`Whitelist sync batch ${i / batchSize + 1} failed:`, insertError);
        continue;
      }

      totalInserted += batch.length;
    }

    console.log(`Synced ${totalInserted} items to whitelist from primary taxonomy`);
    return { success: true, count: totalInserted };

  } catch (error) {
    console.error('Error syncing whitelist with primary taxonomy:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown sync error' 
    };
  }
};

export const getFashionWhitelist = async (): Promise<{ data: FashionWhitelistItem[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('fashion_whitelist')
      .select('*')
      .order('category', { ascending: true })
      .order('item_name', { ascending: true });

    return { data, error };
  } catch (error) {
    console.error('Error fetching fashion whitelist:', error);
    return { data: null, error };
  }
};

export const getFashionWhitelistByCategory = async (category: string): Promise<{ data: FashionWhitelistItem[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('fashion_whitelist')
      .select('*')
      .eq('category', category)
      .order('item_name', { ascending: true });

    return { data, error };
  } catch (error) {
    console.error('Error fetching fashion whitelist by category:', error);
    return { data: null, error };
  }
};

export const searchFashionWhitelist = async (searchTerm: string): Promise<{ data: FashionWhitelistItem[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('fashion_whitelist')
      .select('*')
      .or(`item_name.ilike.%${searchTerm}%,style_descriptors.cs.{${searchTerm}},common_materials.cs.{${searchTerm}}`)
      .order('item_name', { ascending: true });

    return { data, error };
  } catch (error) {
    console.error('Error searching fashion whitelist:', error);
    return { data: null, error };
  }
};
