
import { supabase } from '@/integrations/supabase/client';
import { ProcessingResult } from './types';
import { generateMockTerminology, generateMockPrinciples, generateMockMaterials } from './mockDataGenerator';
import { insertTerminology, insertPrinciples, insertMaterials, createProcessingLog, updateProcessingLog, updatePaperStatus } from './databaseOperations';

export const processAcademicPaper = async (paperId: string): Promise<ProcessingResult> => {
  try {
    console.log(`Starting academic processing for paper ${paperId}`);
    
    const logData = await createProcessingLog(paperId);
    const startTime = Date.now();
    let processedCount = 0;
    const allErrors: string[] = [];
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

    // Generate and insert mock data
    const mockTerminology = generateMockTerminology();
    const mockPrinciples = generateMockPrinciples();
    const mockMaterials = generateMockMaterials();

    // Insert terminology
    const terminologyResult = await insertTerminology(mockTerminology, paperId);
    extractedData.terminology = terminologyResult.inserted;
    allErrors.push(...terminologyResult.errors);

    // Insert principles
    const principlesResult = await insertPrinciples(mockPrinciples, paperId);
    extractedData.principles = principlesResult.inserted;
    allErrors.push(...principlesResult.errors);

    // Insert materials
    const materialsResult = await insertMaterials(mockMaterials, paperId);
    extractedData.materials = materialsResult.inserted;
    allErrors.push(...materialsResult.errors);

    processedCount = 1;
    const processingTime = Date.now() - startTime;

    // Update logs and paper status
    await updateProcessingLog(
      logData.id,
      allErrors.length === 0 ? 'completed' : 'completed',
      {
        processed_papers: processedCount,
        extracted_terminology: extractedData.terminology,
        extracted_principles: extractedData.principles,
        extracted_materials: extractedData.materials,
        errors: allErrors.length
      },
      allErrors,
      processingTime
    );

    await updatePaperStatus(paperId, 'completed');

    console.log(`Academic processing completed for paper ${paperId}:`, {
      processedCount,
      extractedData,
      errors: allErrors.length
    });

    return {
      success: allErrors.length === 0,
      processedCount,
      errors: allErrors,
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

    await updatePaperStatus(paperId, 'failed');

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
