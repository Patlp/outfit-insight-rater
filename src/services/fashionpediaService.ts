
import { supabase } from '@/integrations/supabase/client';

export interface FashionpediaCategory {
  id: string;
  category_name: string;
  category_id?: number;
  description?: string;
  parent_category?: string;
  attributes?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const getFashionpediaCategories = async () => {
  const { data, error } = await supabase
    .from('fashionpedia_categories')
    .select('*')
    .order('category_name');
  
  return { data, error };
};

export const insertFashionpediaCategory = async (category: Omit<FashionpediaCategory, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('fashionpedia_categories')
    .insert(category)
    .select()
    .single();
  
  return { data, error };
};

export const searchFashionpediaCategories = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from('fashionpedia_categories')
    .select('*')
    .or(`category_name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%`)
    .order('category_name');
  
  return { data, error };
};

export const getFashionpediaCategoriesCount = async () => {
  const { count, error } = await supabase
    .from('fashionpedia_categories')
    .select('*', { count: 'exact', head: true });
  
  return { count, error };
};
