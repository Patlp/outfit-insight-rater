
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KaggleDataRow {
  id?: number;
  product_name: string;
  category?: string;
  sub_category?: string;
  brand?: string;
  color?: string;
  size?: string;
  price?: number;
  rating?: number;
  description?: string;
  material?: string;
  season?: string;
  gender?: string;
  age_group?: string;
  [key: string]: any;
}

interface ProcessedKaggleItem {
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
  normalized_name: string;
  tags: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { csvData, batchSize = 100 } = await req.json();

    if (!csvData || !Array.isArray(csvData)) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSV data format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${csvData.length} rows from Kaggle dataset`);

    // Process and transform data
    const processedItems: ProcessedKaggleItem[] = [];
    let processedCount = 0;
    let errorCount = 0;

    for (const row of csvData) {
      try {
        const processed = processKaggleRow(row);
        if (processed) {
          processedItems.push(processed);
          processedCount++;
        }
      } catch (error) {
        console.error('Error processing row:', error, row);
        errorCount++;
      }
    }

    console.log(`Processed ${processedCount} items, ${errorCount} errors`);

    // Insert data in batches
    let insertedCount = 0;
    const batchErrors: string[] = [];

    for (let i = 0; i < processedItems.length; i += batchSize) {
      const batch = processedItems.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('kaggle_clothing_items')
          .insert(batch);

        if (error) {
          console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error);
          batchErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          insertedCount += batch.length;
          console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} items`);
        }
      } catch (batchError) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} exception:`, batchError);
        batchErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${batchError.message}`);
      }
    }

    const result = {
      success: true,
      processed: processedCount,
      inserted: insertedCount,
      errors: errorCount,
      batchErrors: batchErrors.length,
      totalBatches: Math.ceil(processedItems.length / batchSize),
      message: `Successfully processed ${processedCount} items and inserted ${insertedCount} into database`
    };

    if (batchErrors.length > 0) {
      result.batchErrors = batchErrors;
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-kaggle-data function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error during import' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function processKaggleRow(row: KaggleDataRow): ProcessedKaggleItem | null {
  try {
    // Skip rows without essential data
    if (!row.product_name || typeof row.product_name !== 'string') {
      return null;
    }

    const productName = row.product_name.trim();
    if (productName.length === 0) {
      return null;
    }

    // Normalize and clean data
    const normalized = normalizeProductName(productName);
    const tags = generateTags(row);

    return {
      product_name: productName,
      category: cleanString(row.category),
      sub_category: cleanString(row.sub_category),
      brand: cleanString(row.brand),
      color: cleanString(row.color),
      size: cleanString(row.size),
      price: parseNumeric(row.price),
      rating: parseNumeric(row.rating),
      description: cleanString(row.description),
      material: cleanString(row.material),
      season: cleanString(row.season),
      gender: normalizeGender(row.gender),
      age_group: cleanString(row.age_group),
      normalized_name: normalized,
      tags: tags
    };
  } catch (error) {
    console.error('Error processing row:', error, row);
    return null;
  }
}

function cleanString(value: any): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim();
  return cleaned.length > 0 && cleaned.toLowerCase() !== 'unknown' ? cleaned : null;
}

function parseNumeric(value: any): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return !isNaN(num) && isFinite(num) ? num : null;
}

function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeGender(gender: any): string | null {
  if (!gender) return null;
  const g = String(gender).toLowerCase().trim();
  
  if (g.includes('male') && !g.includes('female')) return 'male';
  if (g.includes('female')) return 'female';
  if (g.includes('unisex') || g.includes('neutral')) return 'unisex';
  
  return g.length > 0 ? g : null;
}

function generateTags(row: KaggleDataRow): string[] {
  const tags: string[] = [];
  
  // Add category-based tags
  if (row.category) tags.push(row.category.toLowerCase());
  if (row.sub_category) tags.push(row.sub_category.toLowerCase());
  
  // Add color tags
  if (row.color) tags.push(row.color.toLowerCase());
  
  // Add material tags
  if (row.material) tags.push(row.material.toLowerCase());
  
  // Add brand tags (if popular brands)
  if (row.brand) {
    const brand = row.brand.toLowerCase();
    const popularBrands = ['nike', 'adidas', 'zara', 'h&m', 'uniqlo', 'levi', 'calvin klein'];
    if (popularBrands.some(b => brand.includes(b))) {
      tags.push(brand);
    }
  }
  
  // Extract style tags from product name
  const styleWords = extractStyleWords(row.product_name);
  tags.push(...styleWords);
  
  // Remove duplicates and filter
  return [...new Set(tags)]
    .filter(tag => tag.length > 1)
    .slice(0, 10); // Limit to 10 tags
}

function extractStyleWords(productName: string): string[] {
  const styleKeywords = [
    'casual', 'formal', 'vintage', 'modern', 'classic', 'trendy',
    'fitted', 'loose', 'oversized', 'slim', 'wide', 'narrow',
    'long', 'short', 'mini', 'maxi', 'midi', 'crop',
    'striped', 'solid', 'printed', 'plain', 'basic',
    'button', 'zip', 'wrap', 'collar', 'crew', 'v-neck'
  ];
  
  const words = productName.toLowerCase().split(/\s+/);
  return words.filter(word => styleKeywords.includes(word));
}
