
import { ProcessingResult } from './types';
import { processAcademicPaper } from './paperProcessor';

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

  // Process papers in smaller batches to avoid overwhelming the system
  const batchSize = 5;
  for (let i = 0; i < paperIds.length; i += batchSize) {
    const batch = paperIds.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchPromises = batch.map(paperId => processAcademicPaper(paperId));
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Aggregate results
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const paperResult = result.value;
        overallResult.processedCount += paperResult.processedCount;
        overallResult.errors.push(...paperResult.errors);
        overallResult.extractedData.terminology += paperResult.extractedData.terminology;
        overallResult.extractedData.principles += paperResult.extractedData.principles;
        overallResult.extractedData.categories += paperResult.extractedData.categories;
        overallResult.extractedData.materials += paperResult.extractedData.materials;
        
        if (!paperResult.success) {
          overallResult.success = false;
        }
      } else {
        const paperId = batch[index];
        const errorMsg = result.reason instanceof Error ? result.reason.message : 'Unknown error';
        overallResult.errors.push(`Failed to process paper ${paperId}: ${errorMsg}`);
        overallResult.success = false;
      }
    });
    
    // Brief pause between batches
    if (i + batchSize < paperIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('Bulk academic processing completed:', overallResult);
  return overallResult;
};
