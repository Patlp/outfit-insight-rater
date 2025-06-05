
import { supabase } from '@/integrations/supabase/client';

export interface FashionWhitelistItem {
  id: string;
  item_name: string;
  category: string;
  style_descriptors: string[];
  common_materials: string[];
  created_at: string;
}

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
