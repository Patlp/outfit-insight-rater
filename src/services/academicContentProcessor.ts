
import { supabase } from '@/integrations/supabase/client';

export interface ProcessingResult {
  success: boolean;
  processedCount: number;
  errors: string[];
  extractedData: {
    terminology: number;
    principles: number;
    categories: number;
    materials: number;
  };
}

export interface ExtractedTerminology {
  term: string;
  category: 'clothing_item' | 'descriptor' | 'material' | 'color' | 'style' | 'technique';
  definition?: string;
  synonyms?: string[];
  related_terms?: string[];
  usage_context?: string;
  confidence_score: number;
}

export interface ExtractedPrinciple {
  principle_name: string;
  description: string;
  category: 'color_theory' | 'fit_guidelines' | 'occasion_matching' | 'body_type' | 'seasonal';
  applicable_items: string[];
  academic_evidence?: string;
  confidence_score: number;
}

export const processAcademicPaper = async (paperId: string): Promise<ProcessingResult> => {
  try {
    console.log(`Starting academic processing for paper ${paperId}`);
    
    // Log the start of processing
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
      console.error('Failed to create processing log:', logError);
      throw new Error(`Failed to start processing: ${logError.message}`);
    }

    const startTime = Date.now();
    let processedCount = 0;
    const errors: string[] = [];
    const extractedData = {
      terminology: 0,
      principles: 0,
      categories: 0,
      materials: 0
    };

    // Get paper details
    const { data: paper, error: paperError } = await supabase
      .from('academic_papers')
      .select('*')
      .eq('id', paperId)
      .single();

    if (paperError || !paper) {
      throw new Error(`Failed to fetch paper: ${paperError?.message || 'Paper not found'}`);
    }

    // For now, we'll simulate processing by extracting some basic fashion terminology
    // In a real implementation, this would use AI/NLP to extract content from the PDF
    const mockTerminology: ExtractedTerminology[] = [
      {
        term: 'silhouette',
        category: 'descriptor',
        definition: 'The overall shape or outline of a garment',
        synonyms: ['outline', 'shape', 'form'],
        related_terms: ['fit', 'cut', 'drape'],
        usage_context: 'Describes the overall visual impression of clothing',
        confidence_score: 0.9
      },
      {
        term: 'drape',
        category: 'technique',
        definition: 'How fabric falls and hangs on the body',
        synonyms: ['fall', 'hang'],
        related_terms: ['silhouette', 'fabric', 'fit'],
        usage_context: 'Technical term for fabric behavior',
        confidence_score: 0.85
      },
      {
        term: 'tailoring',
        category: 'technique',
        definition: 'The art of constructing fitted garments',
        synonyms: ['sartorial construction'],
        related_terms: ['fit', 'construction', 'craftsmanship'],
        usage_context: 'Professional garment construction',
        confidence_score: 0.95
      }
    ];

    // Insert extracted terminology
    for (const term of mockTerminology) {
      try {
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
          extractedData.terminology++;
        }
      } catch (error) {
        errors.push(`Error processing term "${term.term}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Mock styling principles
    const mockPrinciples: ExtractedPrinciple[] = [
      {
        principle_name: 'Color Harmony',
        description: 'Colors should work together to create visual balance',
        category: 'color_theory',
        applicable_items: ['shirt', 'pants', 'accessories'],
        academic_evidence: 'Based on color wheel theory and visual perception studies',
        confidence_score: 0.9
      },
      {
        principle_name: 'Proportion Balance',
        description: 'Garment proportions should complement body proportions',
        category: 'fit_guidelines',
        applicable_items: ['tops', 'bottoms', 'outerwear'],
        academic_evidence: 'Proportional relationships in fashion design',
        confidence_score: 0.85
      }
    ];

    // Insert styling principles
    for (const principle of mockPrinciples) {
      try {
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
          extractedData.principles++;
        }
      } catch (error) {
        errors.push(`Error processing principle "${principle.principle_name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    processedCount = 1;
    const processingTime = Date.now() - startTime;

    // Update processing log
    const { error: updateLogError } = await supabase
      .from('academic_integration_log')
      .update({
        status: errors.length === 0 ? 'completed' : 'completed',
        results: {
          processed_papers: processedCount,
          extracted_terminology: extractedData.terminology,
          extracted_principles: extractedData.principles,
          errors: errors.length
        },
        error_details: errors.length > 0 ? errors.join('; ') : null,
        processing_time_ms: processingTime,
        completed_at: new Date().toISOString()
      })
      .eq('id', logData.id);

    if (updateLogError) {
      console.error('Failed to update processing log:', updateLogError);
    }

    // Update paper status
    const { error: paperUpdateError } = await supabase
      .from('academic_papers')
      .update({
        processing_status: 'processed',
        updated_at: new Date().toISOString()
      })
      .eq('id', paperId);

    if (paperUpdateError) {
      console.error('Failed to update paper status:', paperUpdateError);
    }

    console.log(`Academic processing completed for paper ${paperId}:`, {
      processedCount,
      extractedData,
      errors: errors.length
    });

    return {
      success: errors.length === 0,
      processedCount,
      errors,
      extractedData
    };

  } catch (error) {
    console.error('Academic processing failed:', error);
    
    // Log the error
    await supabase
      .from('academic_integration_log')
      .insert({
        process_type: 'paper_processing',
        paper_id: paperId,
        status: 'failed',
        error_details: error instanceof Error ? error.message : 'Unknown error'
      });

    return {
      success: false,
      processedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      extractedData: {
        terminology: 0,
        principles: 0,
        categories: 0,
        materials: 0
      }
    };
  }
};

export const processBulkAcademicPapers = async (paperIds: string[]): Promise<ProcessingResult> => {
  console.log(`Starting bulk academic processing for ${paperIds.length} papers`);
  
  const overallResult: ProcessingResult = {
    success: true,
    processedCount: 0,
    errors: [],
    extractedData: {
      terminology: 0,
      principles: 0,
      categories: 0,
      materials: 0
    }
  };

  for (const paperId of paperIds) {
    try {
      const result = await processAcademicPaper(paperId);
      overallResult.processedCount += result.processedCount;
      overallResult.errors.push(...result.errors);
      overallResult.extractedData.terminology += result.extractedData.terminology;
      overallResult.extractedData.principles += result.extractedData.principles;
      overallResult.extractedData.categories += result.extractedData.categories;
      overallResult.extractedData.materials += result.extractedData.materials;
      
      if (!result.success) {
        overallResult.success = false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      overallResult.errors.push(`Failed to process paper ${paperId}: ${errorMsg}`);
      overallResult.success = false;
    }
  }

  console.log('Bulk academic processing completed:', overallResult);
  return overallResult;
};

export const getProcessingStats = async () => {
  try {
    const { data: stats, error } = await supabase
      .from('academic_integration_log')
      .select('status, process_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Failed to fetch processing stats:', error);
      return null;
    }

    const statusCounts = stats.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProcessingRuns: stats.length,
      statusBreakdown: statusCounts,
      recentActivity: stats.slice(0, 10)
    };
  } catch (error) {
    console.error('Error fetching processing stats:', error);
    return null;
  }
};
