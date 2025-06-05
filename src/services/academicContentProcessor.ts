
// Re-export everything from the new modular structure for backward compatibility
export type { ProcessingResult, ExtractedTerminology, ExtractedPrinciple } from './academic/types';
export { processAcademicPaper } from './academic/paperProcessor';
export { processBulkAcademicPapers } from './academic/bulkProcessor';
export { getProcessingStats } from './academic/statsService';
