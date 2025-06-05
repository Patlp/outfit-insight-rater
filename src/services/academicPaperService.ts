
import { supabase } from '@/integrations/supabase/client';

export interface AcademicPaper {
  id?: string;
  title: string;
  authors?: string[];
  abstract?: string;
  doi?: string;
  publication_year?: number;
  journal?: string;
  keywords?: string[];
  pdf_url?: string;
  pdf_content?: string;
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface FashionAttribute {
  id?: string;
  paper_id: string;
  attribute_type: string;
  attribute_name: string;
  context?: string;
  confidence_score?: number;
  page_number?: number;
  extraction_method?: string;
  metadata?: any;
  created_at?: string;
}

export interface FashionInsight {
  id?: string;
  paper_id: string;
  insight_type: string;
  title: string;
  description: string;
  relevance_score?: number;
  tags?: string[];
  metadata?: any;
  created_at?: string;
}

export const insertAcademicPaper = async (paper: AcademicPaper) => {
  console.log('Inserting academic paper:', paper);
  
  const { data, error } = await supabase
    .from('academic_papers')
    .insert([paper])
    .select()
    .single();

  if (error) {
    console.error('Error inserting academic paper:', error);
    return { data: null, error };
  }

  console.log('Academic paper inserted successfully:', data);
  return { data, error: null };
};

export const getAcademicPapers = async () => {
  console.log('Fetching academic papers...');
  
  const { data, error } = await supabase
    .from('academic_papers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching academic papers:', error);
    return { data: null, error };
  }

  console.log(`Fetched ${data?.length || 0} academic papers`);
  return { data, error: null };
};

export const getAcademicPapersCount = async () => {
  console.log('Fetching academic papers count...');
  
  const { count, error } = await supabase
    .from('academic_papers')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error fetching academic papers count:', error);
    return { count: null, error };
  }

  console.log(`Academic papers count: ${count}`);
  return { count, error: null };
};

export const updateAcademicPaperStatus = async (paperId: string, status: string) => {
  console.log('Updating paper status:', { paperId, status });
  
  const { data, error } = await supabase
    .from('academic_papers')
    .update({ 
      processing_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', paperId)
    .select()
    .single();

  if (error) {
    console.error('Error updating paper status:', error);
    return { data: null, error };
  }

  console.log('Paper status updated successfully:', data);
  return { data, error: null };
};

export const insertFashionAttribute = async (attribute: FashionAttribute) => {
  console.log('Inserting fashion attribute:', attribute);
  
  const { data, error } = await supabase
    .from('fashion_attributes')
    .insert([attribute])
    .select()
    .single();

  if (error) {
    console.error('Error inserting fashion attribute:', error);
    return { data: null, error };
  }

  console.log('Fashion attribute inserted successfully:', data);
  return { data, error: null };
};

export const insertFashionInsight = async (insight: FashionInsight) => {
  console.log('Inserting fashion insight:', insight);
  
  const { data, error } = await supabase
    .from('fashion_insights')
    .insert([insight])
    .select()
    .single();

  if (error) {
    console.error('Error inserting fashion insight:', error);
    return { data: null, error };
  }

  console.log('Fashion insight inserted successfully:', data);
  return { data, error: null };
};

export const getFashionAttributesByPaper = async (paperId: string) => {
  console.log('Fetching fashion attributes for paper:', paperId);
  
  const { data, error } = await supabase
    .from('fashion_attributes')
    .select('*')
    .eq('paper_id', paperId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching fashion attributes:', error);
    return { data: null, error };
  }

  console.log(`Fetched ${data?.length || 0} fashion attributes`);
  return { data, error: null };
};

export const getFashionInsightsByPaper = async (paperId: string) => {
  console.log('Fetching fashion insights for paper:', paperId);
  
  const { data, error } = await supabase
    .from('fashion_insights')
    .select('*')
    .eq('paper_id', paperId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching fashion insights:', error);
    return { data: null, error };
  }

  console.log(`Fetched ${data?.length || 0} fashion insights`);
  return { data, error: null };
};
