
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { processBulkAcademicPapers, getProcessingStats, type ProcessingResult } from '@/services/academicContentProcessor';

interface ProcessingStats {
  totalProcessingRuns: number;
  statusBreakdown: Record<string, number>;
  recentActivity: Array<{
    status: string;
    process_type: string;
    created_at: string;
  }>;
}

export const useAcademicProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [pendingPapers, setPendingPapers] = useState<number>(0);
  const [totalPapers, setTotalPapers] = useState<number>(0);

  const loadStats = async () => {
    const processingStats = await getProcessingStats();
    if (processingStats) {
      setStats(processingStats);
    }
  };

  const loadPaperCounts = async () => {
    try {
      const { data: allPapers, error: allError } = await supabase
        .from('academic_papers')
        .select('id, processing_status');

      if (allError) {
        console.error('Error loading paper counts:', allError);
        return;
      }

      const total = allPapers?.length || 0;
      const pending = allPapers?.filter(p => p.processing_status === 'pending').length || 0;

      setTotalPapers(total);
      setPendingPapers(pending);
    } catch (error) {
      console.error('Error loading paper counts:', error);
    }
  };

  const handleProcessPendingPapers = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingResult(null);

      toast.info('Starting academic paper processing...', {
        description: 'This will extract fashion knowledge from all pending papers.'
      });

      // Get all pending papers
      const { data: papers, error } = await supabase
        .from('academic_papers')
        .select('id')
        .eq('processing_status', 'pending');

      if (error) {
        throw new Error(`Failed to fetch pending papers: ${error.message}`);
      }

      if (!papers || papers.length === 0) {
        toast.info('No pending papers found for processing');
        setIsProcessing(false);
        return;
      }

      const paperIds = papers.map(p => p.id);
      console.log(`Processing ${paperIds.length} academic papers...`);
      
      // Start with some initial progress
      setProcessingProgress(5);

      // Process papers and update progress incrementally
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev < 90) {
            return prev + Math.random() * 10;
          }
          return prev;
        });
      }, 1000);

      const result = await processBulkAcademicPapers(paperIds);

      // Clear the interval and set final progress
      clearInterval(progressInterval);
      setProcessingProgress(100);
      setProcessingResult(result);

      if (result.success) {
        toast.success(`Successfully processed ${result.processedCount} papers!`, {
          description: `Extracted ${result.extractedData.terminology + result.extractedData.principles + result.extractedData.materials} knowledge items.`
        });
      } else {
        toast.error(`Processing completed with ${result.errors.length} errors`, {
          description: 'Check the detailed results below for more information.'
        });
      }

      // Reload stats and counts
      await Promise.all([loadStats(), loadPaperCounts()]);

    } catch (error) {
      console.error('Processing failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setProcessingResult({
        success: false,
        processedCount: 0,
        errors: [errorMsg],
        extractedData: { terminology: 0, principles: 0, categories: 0, materials: 0 }
      });
      toast.error('Processing failed: ' + errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadPaperCounts();
  }, []);

  return {
    isProcessing,
    processingProgress,
    processingResult,
    stats,
    pendingPapers,
    totalPapers,
    handleProcessPendingPapers,
    loadStats,
    loadPaperCounts
  };
};
