
import { supabase } from '@/integrations/supabase/client';
import { ExtractedTerminology, ExtractedPrinciple, ExtractedMaterial } from './types';

export const insertTerminology = async (terminology: ExtractedTerminology[], paperId: string): Promise<{ inserted: number; errors: string[] }> => {
  let inserted = 0;
  const errors: string[] = [];

  for (const term of terminology) {
    try {
      const { data: existingTerm } = await supabase
        .from('fashion_terminology')
        .select('id')
        .eq('term', term.term)
        .single();

      if (!existingTerm) {
        const { error: termError } = await supabase
          .from('fashion_terminology')
          .insert({
            term: term.term,
            category: term.category,
            definition: term.definition,
            synonyms: term.synonyms,
            related_terms: term.related_terms,
            usage_context: term.usage_context,
            confidence_score: term.confidence_score,
            source_papers: [paperId]
          });

        if (termError) {
          errors.push(`Failed to insert term "${term.term}": ${termError.message}`);
        } else {
          inserted++;
        }
      }
    } catch (error) {
      errors.push(`Error processing term "${term.term}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { inserted, errors };
};

export const insertPrinciples = async (principles: ExtractedPrinciple[], paperId: string): Promise<{ inserted: number; errors: string[] }> => {
  let inserted = 0;
  const errors: string[] = [];

  for (const principle of principles) {
    try {
      const { data: existingPrinciple } = await supabase
        .from('fashion_styling_principles')
        .select('id')
        .eq('principle_name', principle.principle_name)
        .single();

      if (!existingPrinciple) {
        const { error: principleError } = await supabase
          .from('fashion_styling_principles')
          .insert({
            principle_name: principle.principle_name,
            description: principle.description,
            category: principle.category,
            applicable_items: principle.applicable_items,
            academic_evidence: principle.academic_evidence,
            confidence_score: principle.confidence_score,
            source_papers: [paperId]
          });

        if (principleError) {
          errors.push(`Failed to insert principle "${principle.principle_name}": ${principleError.message}`);
        } else {
          inserted++;
        }
      }
    } catch (error) {
      errors.push(`Error processing principle "${principle.principle_name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { inserted, errors };
};

export const insertMaterials = async (materials: ExtractedMaterial[], paperId: string): Promise<{ inserted: number; errors: string[] }> => {
  let inserted = 0;
  const errors: string[] = [];

  for (const material of materials) {
    try {
      const { data: existingMaterial } = await supabase
        .from('fashion_material_properties')
        .select('id')
        .eq('material_name', material.material_name)
        .single();

      if (!existingMaterial) {
        const { error: materialError } = await supabase
          .from('fashion_material_properties')
          .insert({
            material_name: material.material_name,
            material_type: material.material_type,
            properties: material.properties,
            seasonal_appropriateness: material.seasonal_appropriateness,
            typical_uses: material.typical_uses,
            confidence_score: material.confidence_score,
            source_papers: [paperId]
          });

        if (materialError) {
          errors.push(`Failed to insert material "${material.material_name}": ${materialError.message}`);
        } else {
          inserted++;
        }
      }
    } catch (error) {
      errors.push(`Error processing material "${material.material_name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { inserted, errors };
};

export const createProcessingLog = async (paperId: string) => {
  const { data: logData, error: logError } = await supabase
    .from('academic_integration_log')
    .insert({
      process_type: 'paper_processing',
      paper_id: paperId,
      status: 'processing'
    })
    .select()
    .single();

  if (logError) {
    throw new Error(`Failed to start processing: ${logError.message}`);
  }

  return logData;
};

export const updateProcessingLog = async (
  logId: string, 
  status: string, 
  results: any, 
  errors: string[], 
  processingTime: number
) => {
  const { error: updateLogError } = await supabase
    .from('academic_integration_log')
    .update({
      status,
      results,
      error_details: errors.length > 0 ? errors.join('; ') : null,
      processing_time_ms: processingTime,
      completed_at: new Date().toISOString()
    })
    .eq('id', logId);

  if (updateLogError) {
    console.error('Failed to update processing log:', updateLogError);
  }
};

export const updatePaperStatus = async (paperId: string, status: string) => {
  const { error: paperUpdateError } = await supabase
    .from('academic_papers')
    .update({
      processing_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', paperId);

  if (paperUpdateError) {
    console.error('Failed to update paper status:', paperUpdateError);
  }
};
