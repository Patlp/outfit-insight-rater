
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  BookOpen, 
  Cpu, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Target,
  Layers,
  Palette,
  Shirt
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { processAcademicPaper, processBulkAcademicPapers, getProcessingStats, type ProcessingResult } from '@/services/academicContentProcessor';

interface ProcessingStats {
  totalProcessingRuns: number;
  statusBreakdown: Record<string, number>;
  recentActivity: Array<{
    status: string;
    process_type: string;
    created_at: string;
  }>;
}

const AcademicProcessingPanel: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [pendingPapers, setPendingPapers] = useState<number>(0);
  const [totalPapers, setTotalPapers] = useState<number>(0);

  useEffect(() => {
    loadStats();
    loadPaperCounts();
  }, []);

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
        return;
      }

      toast.info(`Starting processing of ${papers.length} academic papers...`);
      setProcessingProgress(10);

      const paperIds = papers.map(p => p.id);
      const result = await processBulkAcademicPapers(paperIds);

      setProcessingProgress(100);
      setProcessingResult(result);

      if (result.success) {
        toast.success(`Successfully processed ${result.processedCount} papers and extracted ${result.extractedData.terminology + result.extractedData.principles} knowledge items!`);
      } else {
        toast.error(`Processing completed with ${result.errors.length} errors`);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="text-purple-500" size={24} />
          Academic Knowledge Processing
        </CardTitle>
        <p className="text-sm text-gray-600">
          Extract fashion knowledge from academic papers to enhance clothing tagging
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Paper Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <BookOpen className="mx-auto text-blue-500 mb-2" size={20} />
            <div className="text-2xl font-bold text-blue-700">{totalPapers}</div>
            <div className="text-xs text-blue-600">Total Papers</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <Clock className="mx-auto text-yellow-500 mb-2" size={20} />
            <div className="text-2xl font-bold text-yellow-700">{pendingPapers}</div>
            <div className="text-xs text-yellow-600">Pending Processing</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircle className="mx-auto text-green-500 mb-2" size={20} />
            <div className="text-2xl font-bold text-green-700">{totalPapers - pendingPapers}</div>
            <div className="text-xs text-green-600">Processed</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Cpu className="mx-auto text-purple-500 mb-2" size={20} />
            <div className="text-2xl font-bold text-purple-700">
              {stats?.totalProcessingRuns || 0}
            </div>
            <div className="text-xs text-purple-600">Processing Runs</div>
          </div>
        </div>

        <Separator />

        {/* Processing Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Knowledge Extraction</h3>
              <p className="text-sm text-gray-600">
                Process academic papers to extract fashion terminology, styling principles, and material properties
              </p>
            </div>
            <Button 
              onClick={handleProcessPendingPapers}
              disabled={isProcessing || pendingPapers === 0}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Processing...
                </>
              ) : (
                <>
                  <Brain size={16} />
                  Process {pendingPapers} Papers
                </>
              )}
            </Button>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Progress</span>
                <span>{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
            </div>
          )}
        </div>

        {/* Processing Results */}
        {processingResult && (
          <Alert className={processingResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {processingResult.success ? (
                <CheckCircle className="text-green-500" size={16} />
              ) : (
                <AlertCircle className="text-red-500" size={16} />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    {processingResult.success ? 'Processing Completed Successfully!' : 'Processing Completed with Errors'}
                  </p>
                  
                  {processingResult.success && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="text-blue-500" size={14} />
                        <span>{processingResult.extractedData.terminology} Terms</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Layers className="text-green-500" size={14} />
                        <span>{processingResult.extractedData.principles} Principles</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Shirt className="text-purple-500" size={14} />
                        <span>{processingResult.extractedData.categories} Categories</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Palette className="text-orange-500" size={14} />
                        <span>{processingResult.extractedData.materials} Materials</span>
                      </div>
                    </div>
                  )}

                  {processingResult.errors.length > 0 && (
                    <details className="text-sm mt-2">
                      <summary className="cursor-pointer">View Errors ({processingResult.errors.length})</summary>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-red-600">
                        {processingResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Processing History */}
        {stats && stats.recentActivity.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Recent Processing Activity</h3>
            <div className="space-y-2">
              {stats.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                    <span className="text-sm">{activity.process_type.replace('_', ' ')}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AcademicProcessingPanel;
