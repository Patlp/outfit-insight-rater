
import { supabase } from '@/integrations/supabase/client';

export interface KaggleClothingItem {
  id: string;
  product_name: string;
  category: string | null;
  sub_category: string | null;
  brand: string | null;
  color: string | null;
  size: string | null;
  price: number | null;
  rating: number | null;
  description: string | null;
  material: string | null;
  season: string | null;
  gender: string | null;
  age_group: string | null;
  normalized_name: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export const searchKaggleClothingItems = async (
  query: string,
  gender?: string,
  limit: number = 20
): Promise<{ data: KaggleClothingItem[] | null; error: any }> => {
  try {
    console.log(`Searching Kaggle dataset for: "${query}"`);
    
    // Normalize the query for better matching
    const normalizedQuery = query.toLowerCase().trim();
    
    let queryBuilder = supabase
      .from('kaggle_clothing_items')
      .select('*')
      .or(`normalized_name.ilike.%${normalizedQuery}%,tags.cs.{${normalizedQuery}},product_name.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`)
      .limit(limit);

    // Filter by gender if provided
    if (gender && gender !== 'neutral') {
      queryBuilder = queryBuilder.or(`gender.ilike.%${gender}%,gender.is.null`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error searching Kaggle clothing items:', error);
      return { data: null, error };
    }

    console.log(`Found ${data?.length || 0} matching items from Kaggle dataset`);
    return { data, error: null };

  } catch (error) {
    console.error('Error in searchKaggleClothingItems:', error);
    return { data: null, error };
  }
};

export const getClothingItemsByCategory = async (
  category: string,
  gender?: string,
  limit: number = 10
): Promise<{ data: KaggleClothingItem[] | null; error: any }> => {
  try {
    let queryBuilder = supabase
      .from('kaggle_clothing_items')
      .select('*')
      .or(`category.ilike.%${category}%,sub_category.ilike.%${category}%`)
      .limit(limit);

    if (gender && gender !== 'neutral') {
      queryBuilder = queryBuilder.or(`gender.ilike.%${gender}%,gender.is.null`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error getting clothing items by category:', error);
      return { data: null, error };
    }

    return { data, error: null };

  } catch (error) {
    console.error('Error in getClothingItemsByCategory:', error);
    return { data: null, error };
  }
};

export const importKaggleDataSample = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // Sample data to test the integration
    const sampleData = [
      {
        product_name: "Men's Classic Blue Jeans",
        category: "bottoms",
        sub_category: "jeans",
        brand: "Levi's",
        color: "blue",
        size: "32",
        price: 79.99,
        rating: 4.5,
        description: "Classic straight-fit blue jeans made from premium denim",
        material: "denim",
        season: "all-season",
        gender: "male",
        age_group: "adult",
        normalized_name: "mens classic blue jeans",
        tags: ["jeans", "blue", "denim", "classic", "straight-fit", "mens"]
      },
      {
        product_name: "Women's White Cotton T-Shirt",
        category: "tops",
        sub_category: "t-shirt",
        brand: "H&M",
        color: "white",
        size: "M",
        price: 12.99,
        rating: 4.2,
        description: "Basic white cotton t-shirt with crew neck",
        material: "cotton",
        season: "spring-summer",
        gender: "female",
        age_group: "adult",
        normalized_name: "womens white cotton t-shirt",
        tags: ["t-shirt", "white", "cotton", "basic", "crew-neck", "womens"]
      },
      {
        product_name: "Unisex Black Sneakers",
        category: "footwear",
        sub_category: "sneakers",
        brand: "Nike",
        color: "black",
        size: "9",
        price: 120.00,
        rating: 4.7,
        description: "Comfortable black sneakers suitable for everyday wear",
        material: "synthetic",
        season: "all-season",
        gender: "unisex",
        age_group: "adult",
        normalized_name: "unisex black sneakers",
        tags: ["sneakers", "black", "unisex", "comfortable", "athletic"]
      }
    ];

    const { error } = await supabase
      .from('kaggle_clothing_items')
      .insert(sampleData);

    if (error) {
      console.error('Error importing sample data:', error);
      return { success: false, error: error.message };
    }

    console.log('Sample Kaggle data imported successfully');
    return { success: true };

  } catch (error) {
    console.error('Error in importKaggleDataSample:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
