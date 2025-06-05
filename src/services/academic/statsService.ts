
import { supabase } from '@/integrations/supabase/client';

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
